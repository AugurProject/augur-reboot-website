#!/usr/bin/env python3
"""
Audit Claude Code memory files for hygiene issues.

Checks for:
- Outdated timestamps
- Duplicate or redundant information
- Overly long entries
- Potential conflicts
- File organization issues
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import json

def audit_memory_directory(memory_dir: Path):
    """Audit all memory files in the directory."""
    
    if not memory_dir.exists():
        print(f"❌ Memory directory not found: {memory_dir}")
        return
    
    issues = {
        "stale_files": [],
        "large_files": [],
        "redundancy_warnings": [],
        "organization_issues": [],
        "stats": {}
    }
    
    memory_files = list(memory_dir.glob("**/*.md"))
    
    if not memory_files:
        print(f"⚠️  No memory files found in {memory_dir}")
        return
    
    print(f"📊 Auditing {len(memory_files)} memory files...\n")
    
    # Check each file
    total_size = 0
    for file_path in memory_files:
        file_size = file_path.stat().st_size
        total_size += file_size
        
        # Check file size
        if file_size > 50000:  # ~50KB
            issues["large_files"].append({
                "file": str(file_path.relative_to(memory_dir)),
                "size": file_size,
                "size_kb": round(file_size / 1024, 1)
            })
        
        # Check modification time
        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
        age_days = (datetime.now() - mtime).days
        
        if age_days > 60:  # Haven't been updated in 2+ months
            issues["stale_files"].append({
                "file": str(file_path.relative_to(memory_dir)),
                "last_modified": mtime.strftime("%Y-%m-%d"),
                "age_days": age_days
            })
        
        # Check for common redundancy patterns
        content = file_path.read_text()
        if content.count("TODO") > 5:
            issues["redundancy_warnings"].append({
                "file": str(file_path.relative_to(memory_dir)),
                "issue": "Contains many TODO items (consider consolidating)"
            })
    
    # Check organization
    if len(memory_files) > 10 and memory_dir.glob("*.md"):
        root_files = list(memory_dir.glob("*.md"))
        if len(root_files) > 3:
            issues["organization_issues"].append(
                f"Many files ({len(root_files)}) in root directory - consider organizing into subdirectories"
            )
    
    # Store stats
    issues["stats"] = {
        "total_files": len(memory_files),
        "total_size_kb": round(total_size / 1024, 1),
        "avg_file_size_kb": round(total_size / len(memory_files) / 1024, 1)
    }
    
    # Print report
    print("=" * 60)
    print("📋 MEMORY AUDIT REPORT")
    print("=" * 60)
    
    print(f"\n📈 Statistics:")
    print(f"  • Total files: {issues['stats']['total_files']}")
    print(f"  • Total size: {issues['stats']['total_size_kb']} KB")
    print(f"  • Average file size: {issues['stats']['avg_file_size_kb']} KB")
    
    if issues["stale_files"]:
        print(f"\n⏰ Stale Files ({len(issues['stale_files'])}):")
        for item in issues["stale_files"]:
            print(f"  • {item['file']}")
            print(f"    Last modified: {item['last_modified']} ({item['age_days']} days ago)")
    
    if issues["large_files"]:
        print(f"\n📦 Large Files ({len(issues['large_files'])}):")
        for item in issues["large_files"]:
            print(f"  • {item['file']} ({item['size_kb']} KB)")
    
    if issues["redundancy_warnings"]:
        print(f"\n⚠️  Redundancy Warnings ({len(issues['redundancy_warnings'])}):")
        for item in issues["redundancy_warnings"]:
            print(f"  • {item['file']}: {item['issue']}")
    
    if issues["organization_issues"]:
        print(f"\n📁 Organization Issues:")
        for issue in issues["organization_issues"]:
            print(f"  • {issue}")
    
    if not any([issues["stale_files"], issues["large_files"], 
                issues["redundancy_warnings"], issues["organization_issues"]]):
        print("\n✅ No issues found! Memory is in good shape.")
    
    print("\n" + "=" * 60)
    
    # Export JSON for programmatic use
    json_output = memory_dir / ".audit_report.json"
    with open(json_output, 'w') as f:
        json.dump(issues, f, indent=2)
    print(f"\n💾 Detailed report saved to: {json_output}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        memory_path = Path(sys.argv[1])
    else:
        # Default to .claude/memory in current directory
        memory_path = Path.cwd() / ".claude" / "memory"
    
    audit_memory_directory(memory_path)
