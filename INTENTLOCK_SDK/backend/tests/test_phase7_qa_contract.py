"""
INTENTLOCK 2.0 – Phase 7 Documentation QA, Search & Accessibility Test Suite.

Verifies:
1. All 24 Developer routes are indexed in DOCS_SEARCH_INDEX.
2. Every indexed route exists and has non-empty metadata.
3. Zero broken internal links across all documentation pages.
4. Python >= 3.12 requirement is consistently documented.
5. All table elements are wrapped in responsive overflow-x-auto containers.
6. Accessibility attributes (WCAG 2.2 AA targeting) on search, tabs, sidebar, and layout.
"""

import re
from pathlib import Path
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = REPO_ROOT / "frontend"
DEV_PAGES_DIR = FRONTEND_DIR / "src" / "app" / "developers"
DOCS_CONFIG_PATH = FRONTEND_DIR / "src" / "lib" / "docs-config.ts"


def test_search_index_completeness_and_validity():
    """Verify that DOCS_SEARCH_INDEX contains exactly 24 valid routes."""
    content = DOCS_CONFIG_PATH.read_text(encoding="utf-8")
    assert "export const DOCS_SEARCH_INDEX: SearchDocItem[]" in content

    # Extract all items in DOCS_SEARCH_INDEX
    search_part = content[content.find("DOCS_SEARCH_INDEX"):]
    hrefs = re.findall(r'href:\s*"([^"]+)"', search_part)
    titles = re.findall(r'title:\s*"([^"]+)"', search_part)
    summaries = re.findall(r'summary:\s*"([^"]+)"', search_part)

    assert len(hrefs) == 24, f"Expected 24 indexed search items, found {len(hrefs)}"
    assert len(titles) == 24
    assert len(summaries) == 24

    # Verify every href corresponds to a valid existing file or route
    for href in hrefs:
        if href == "/test":
            test_page = FRONTEND_DIR / "src" / "app" / "test" / "page.tsx"
            assert test_page.exists(), "/test route missing"
        elif href == "/developers":
            dev_page = DEV_PAGES_DIR / "page.tsx"
            assert dev_page.exists(), "/developers landing missing"
        else:
            rel_route = href.replace("/developers/", "")
            target_page = DEV_PAGES_DIR / rel_route / "page.tsx"
            assert target_page.exists(), f"Indexed route {href} not found at {target_page}"


def test_zero_broken_internal_links():
    """Verify that every internal developer link points to a valid route."""
    pages = list(DEV_PAGES_DIR.rglob("page.tsx"))
    valid_routes = {"/developers", "/test"} | {
        "/developers/" + str(p.parent.relative_to(DEV_PAGES_DIR)).replace("\\", "/")
        for p in pages
        if p.parent != DEV_PAGES_DIR
    }

    broken_links = []
    for p in pages:
        content = p.read_text(encoding="utf-8")
        # Match href="/developers..." and href="/test"
        for match in re.finditer(r'href:\s*"(/developers[^"]*|/test)"', content):
            href = match.group(1)
            if href not in valid_routes:
                broken_links.append((str(p.name), href))

    assert len(broken_links) == 0, f"Found broken internal links: {broken_links}"


def test_python_minimum_version_consistency():
    """Verify that documentation reflects Python >= 3.12 from pyproject.toml."""
    pyproject_path = REPO_ROOT / "sdk" / "python" / "pyproject.toml"
    pyproject_content = pyproject_path.read_text(encoding="utf-8")
    assert 'requires-python = ">=3.12"' in pyproject_content

    # Verify no developer pages incorrectly claim Python >= 3.10 is sufficient
    for p in DEV_PAGES_DIR.rglob("page.tsx"):
        content = p.read_text(encoding="utf-8")
        assert "requires <strong>Python &ge; 3.10</strong>" not in content
        assert "requires <strong>Python >= 3.10</strong>" not in content
        assert "requires Python >= 3.10" not in content


def test_responsive_table_wrapping():
    """Verify that all table elements are wrapped in overflow containers."""
    for p in DEV_PAGES_DIR.rglob("page.tsx"):
        lines = p.read_text(encoding="utf-8").splitlines()
        for idx, line in enumerate(lines):
            if "<table" in line:
                context = " ".join(lines[max(0, idx - 4):idx])
                assert "overflow" in context, f"Table in {p.name} line {idx+1} not wrapped in overflow container"


def test_accessibility_invariants():
    """Verify ARIA and keyboard accessibility attributes on core documentation components."""
    search_code = (FRONTEND_DIR / "src" / "components" / "developers" / "DocumentationSearch.tsx").read_text(encoding="utf-8")
    assert 'role="dialog"' in search_code
    assert 'aria-modal="true"' in search_code
    assert 'role="combobox"' in search_code
    assert 'role="listbox"' in search_code
    assert 'role="option"' in search_code
    assert 'aria-live="polite"' in search_code
    assert "ArrowDown" in search_code
    assert "ArrowUp" in search_code
    assert "Enter" in search_code
    assert "Escape" in search_code

    tabs_code = (FRONTEND_DIR / "src" / "components" / "developers" / "CodeTabs.tsx").read_text(encoding="utf-8")
    assert 'role="tablist"' in tabs_code
    assert 'role="tab"' in tabs_code
    assert 'role="tabpanel"' in tabs_code
    assert "aria-selected" in tabs_code
    assert "ArrowRight" in tabs_code
    assert "ArrowLeft" in tabs_code

    sidebar_code = (FRONTEND_DIR / "src" / "components" / "developers" / "DeveloperSidebar.tsx").read_text(encoding="utf-8")
    assert "aria-current" in sidebar_code
    assert "aria-label" in sidebar_code

    layout_code = (FRONTEND_DIR / "src" / "components" / "developers" / "DeveloperLayout.tsx").read_text(encoding="utf-8")
    assert "aria-expanded" in layout_code
    assert "aria-controls" in layout_code
    assert 'role="dialog"' in layout_code
