#!/usr/bin/env python3
"""
Capture learnings from Claude Code sessions into structured memory.

This script helps document solutions to problems that Claude struggled with,
preventing repeated mistakes in future sessions.
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import json

def create_learning_entry(memory_dir: Path, category: str, title: str, 
                         problem: str, solution: str, context: str = ""):
    """Create a structured learning entry in the memory system."""
    
    learnings_dir = memory_dir / "learnings"
    learnings_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine the file based on category
    category_files = {
        "build": "build_issues.md",
        "test": "testing_issues.md",
        "deploy": "deployment_issues.md",
        "debug": "debugging_solutions.md",
        "integration": "integration_issues.md",
        "performance": "performance_solutions.md",
        "tooling": "tooling_issues.md",
        "general": "general_learnings.md"
    }
    
    filename = category_files.get(category.lower(), "general_learnings.md")
    filepath = learnings_dir / filename
    
    # Create file if it doesn't exist
    if not filepath.exists():
        header = f"""# {category.title()} Learnings

Solutions to problems Claude encountered in past sessions.

**Purpose:** Prevent repeating the same mistakes and struggling with known issues.

**Format:** Each entry includes the problem, solution, and context for when to apply it.

---

"""
        filepath.write_text(header)
    
    # Format the new entry
    timestamp = datetime.now().strftime("%Y-%m-%d")
    entry = f"""## {title}

**Date:** {timestamp}

**Problem:**
{problem}

**Solution:**
{solution}
"""
    
    if context:
        entry += f"""
**Context/When to Apply:**
{context}
"""
    
    entry += "\n---\n\n"
    
    # Append to file
    with open(filepath, 'a') as f:
        f.write(entry)
    
    return filepath

def interactive_capture():
    """Interactive mode to capture a learning."""
    print("🎓 Claude Code Learning Capture")
    print("=" * 60)
    print()
    
    # Get memory directory
    default_path = Path.cwd() / ".claude" / "memory"
    memory_input = input(f"Memory directory [{default_path}]: ").strip()
    memory_dir = Path(memory_input) if memory_input else default_path
    
    if not memory_dir.exists():
        create = input(f"Directory doesn't exist. Create it? [y/N]: ").strip().lower()
        if create == 'y':
            memory_dir.mkdir(parents=True, exist_ok=True)
        else:
            print("❌ Aborted")
            return
    
    print("\nCategories: build, test, deploy, debug, integration, performance, tooling, general")
    category = input("Category: ").strip() or "general"
    
    print()
    title = input("Short title (e.g., 'Python import error with local modules'): ").strip()
    
    print("\nDescribe the PROBLEM (what Claude struggled with):")
    print("(Enter a blank line when done)")
    problem_lines = []
    while True:
        line = input()
        if line == "":
            break
        problem_lines.append(line)
    problem = "\n".join(problem_lines)
    
    print("\nDescribe the SOLUTION (what finally worked):")
    print("(Enter a blank line when done)")
    solution_lines = []
    while True:
        line = input()
        if line == "":
            break
        solution_lines.append(line)
    solution = "\n".join(solution_lines)
    
    print("\nOptional: Add context about when to apply this (blank to skip):")
    print("(Enter a blank line when done)")
    context_lines = []
    while True:
        line = input()
        if line == "":
            break
        context_lines.append(line)
    context = "\n".join(context_lines) if context_lines else ""
    
    # Create the entry
    filepath = create_learning_entry(memory_dir, category, title, problem, solution, context)
    
    print()
    print(f"✅ Learning saved to: {filepath}")
    print()
    print("💡 Tip: Reference this in your .claude/CLAUDE.md if it's critical:")
    print(f"   - See `.claude/memory/learnings/{filepath.name}` for known issues and solutions")

def quick_capture(memory_dir: Path, category: str, title: str, 
                 problem: str, solution: str, context: str = ""):
    """Quick non-interactive capture for scripting."""
    filepath = create_learning_entry(memory_dir, category, title, problem, solution, context)
    print(f"✅ Learning saved to: {filepath}")
    return filepath

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("""
Usage:
  Interactive mode:
    python capture_learning.py
  
  Quick mode (for scripting):
    python capture_learning.py --quick --category <cat> --title <title> \\
        --problem <problem> --solution <solution> [--context <context>] \\
        [--memory-dir <path>]

Categories:
  build, test, deploy, debug, integration, performance, tooling, general

Examples:
  # Interactive
  python capture_learning.py
  
  # Quick
  python capture_learning.py --quick \\
    --category debug \\
    --title "Python import error with local modules" \\
    --problem "Could not import local modules despite correct structure" \\
    --solution "Added __init__.py files and used python -m module.main"
""")
        sys.exit(0)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        # Parse arguments
        args = {}
        i = 2
        while i < len(sys.argv):
            if sys.argv[i].startswith("--"):
                key = sys.argv[i][2:]
                if i + 1 < len(sys.argv):
                    args[key] = sys.argv[i + 1]
                    i += 2
                else:
                    print(f"❌ Missing value for {sys.argv[i]}")
                    sys.exit(1)
            else:
                i += 1
        
        memory_dir = Path(args.get("memory-dir", ".claude/memory"))
        quick_capture(
            memory_dir=memory_dir,
            category=args.get("category", "general"),
            title=args.get("title", "Untitled"),
            problem=args.get("problem", ""),
            solution=args.get("solution", ""),
            context=args.get("context", "")
        )
    else:
        # Interactive mode
        interactive_capture()
