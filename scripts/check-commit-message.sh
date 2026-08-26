#!/bin/sh
# Rejects commit messages that do not follow Conventional Commits.
# Allowed types come from CLAUDE.md and docs/code_guideline.md.
set -eu

message_file="$1"
pattern='^(feat|fix|docs|chore|refactor|test|style|perf|ci)(\(.+\))?!?: .+'

if grep -qE "$pattern" "$message_file"; then
  exit 0
fi

echo "Commit message must follow Conventional Commits."
echo "Allowed types: feat, fix, docs, chore, refactor, test, style, perf, ci."
echo "Example: feat: add login screen"
exit 1
