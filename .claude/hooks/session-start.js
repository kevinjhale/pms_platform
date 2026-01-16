#!/usr/bin/env node
/**
 * SessionStart Hook - Loads context when a new session begins
 *
 * This hook fires when Claude Code starts a new session.
 * It injects relevant context to help Claude understand the project state.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const SESSION_NOTES = path.join(PROJECT_ROOT, 'SESSION_NOTES.md');
const CONTEXT_SNAPSHOT = path.join(PROJECT_ROOT, '.claude', 'CONTEXT_SNAPSHOT.md');
const TODO_TONIGHT = path.join(PROJECT_ROOT, 'TODO_TONIGHT.md');

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function getRecentCommits(count = 5) {
  try {
    return execSync(`git log --oneline -${count}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    return null;
  }
}

function getGitStatus() {
  try {
    return execSync('git status --short', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    return null;
  }
}

function extractSection(content, sectionName) {
  const regex = new RegExp(`## ${sectionName}[\\s\\S]*?(?=## |$)`, 'i');
  const match = content.match(regex);
  return match ? match[0].trim() : null;
}

function main() {
  const output = [];

  output.push('# Session Context Recovery');
  output.push('');
  output.push('*This context was automatically loaded by the session-start hook.*');
  output.push('');

  // Check for recent snapshot (indicates recent compaction)
  const snapshot = readFileIfExists(CONTEXT_SNAPSHOT);
  if (snapshot) {
    const snapshotStats = fs.statSync(CONTEXT_SNAPSHOT);
    const ageMinutes = (Date.now() - snapshotStats.mtimeMs) / 1000 / 60;

    if (ageMinutes < 60) {
      output.push('## Recent Compaction Detected');
      output.push('');
      output.push(`A context snapshot was saved ${Math.round(ageMinutes)} minutes ago.`);
      output.push('Review `.claude/CONTEXT_SNAPSHOT.md` if you need to recover lost context.');
      output.push('');
    }
  }

  // Load TODO_TONIGHT if it exists (immediate priorities)
  const todoTonight = readFileIfExists(TODO_TONIGHT);
  if (todoTonight) {
    output.push('## Immediate Priorities (TODO_TONIGHT.md)');
    output.push('');
    // Extract just the first section or summary
    const lines = todoTonight.split('\n').slice(0, 30);
    output.push(lines.join('\n'));
    output.push('');
    output.push('*See full file for details.*');
    output.push('');
  }

  // Load SESSION_NOTES current focus
  const sessionNotes = readFileIfExists(SESSION_NOTES);
  if (sessionNotes) {
    const currentFocus = extractSection(sessionNotes, 'Current Focus');
    const recentWork = extractSection(sessionNotes, 'Recent Work');

    if (currentFocus) {
      output.push(currentFocus);
      output.push('');
    }

    if (recentWork) {
      output.push(recentWork);
      output.push('');
    }
  }

  // Git state
  const commits = getRecentCommits();
  const status = getGitStatus();

  if (commits) {
    output.push('## Recent Commits');
    output.push('');
    output.push('```');
    output.push(commits);
    output.push('```');
    output.push('');
  }

  if (status) {
    output.push('## Uncommitted Changes');
    output.push('');
    output.push('```');
    output.push(status);
    output.push('```');
    output.push('');
  }

  // Output to stdout - this gets injected into Claude's context
  console.log(output.join('\n'));
}

main();
