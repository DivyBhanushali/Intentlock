# INTENTLOCK — Pitch and Defense Document Generator (DOCX & PDF)
import os
import sys

def generate_docx(output_path: str):
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    doc = Document()

    # Set page margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Color Palette: Deep Navy (#0d1b2a), Emerald Accent (#10b981), Slate (#475569)
    COLOR_NAVY = RGBColor(13, 27, 42)
    COLOR_EMERALD = RGBColor(16, 185, 129)
    COLOR_SLATE = RGBColor(71, 85, 105)

    def set_cell_background(cell, fill_hex):
        tcPr = cell._element.get_or_add_tcPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'), fill_hex)
        tcPr.append(shd)

    # Document Header / Banner
    p_top = doc.add_paragraph()
    r_sub = p_top.add_run("BSc IT FINAL YEAR ENGINEERING PROJECT | VIVA & INDUSTRY DEFENSE GUIDE\n")
    r_sub.font.size = Pt(9)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_EMERALD

    r_title = p_top.add_run("INTENTLOCK: AI Agent Security Middleware & Developer SDK\n")
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_NAVY

    r_meta = p_top.add_run("Author: Divy Bhanushali | Status: Production Ready (88/88 Tests Passed · 15/15 Threats Blocked)")
    r_meta.font.size = Pt(10)
    r_meta.font.italic = True
    r_meta.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Helper for headings
    def add_custom_heading(text: str, level=1):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(4)
        run = h.add_run(text)
        run.bold = True
        if level == 1:
            run.font.size = Pt(14)
            run.font.color.rgb = COLOR_NAVY
        else:
            run.font.size = Pt(12)
            run.font.color.rgb = COLOR_EMERALD
        return h

    # Section 1: Executive Summary & Elevator Pitch
    add_custom_heading("1. Executive Summary & 30-Second Elevator Pitch")
    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    r_box = p_box.add_run(
        "\"Autonomous AI agents are being connected directly to enterprise file systems, SQL databases, email accounts, and payment APIs. "
        "However, Large Language Models are non-deterministic and fundamentally vulnerable to Prompt Injections, Context Confusion, and Jailbreaks.\n\n"
        "Today, developers attempt to secure agents by adding system prompt instructions ('Please don't delete files') or using a second LLM to police the first. "
        "That is asking one thief to watch another thief.\n\n"
        "INTENTLOCK is an out-of-band, code-level Security Middleware and Python Developer SDK. It sits at the execution boundary between the AI agent "
        "and real-world tools. Every tool call is intercepted and deterministically evaluated against hard-coded policy rules, single-use cryptographic approvals, "
        "and an append-only audit trail before any code can execute. We don't trust the AI to secure the AI. We enforce Zero Trust in code.\""
    )
    r_box.font.size = Pt(10.5)
    r_box.font.italic = True
    r_box.font.color.rgb = COLOR_NAVY

    # Section 2: Core Problem vs IntentLock Solution
    add_custom_heading("2. The Problem vs. IntentLock Solution")
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Industry's Flawed Approach"
    hdr_cells[1].text = "IntentLock Zero-Trust Middleware"
    for cell in hdr_cells:
        set_cell_background(cell, "0d1b2a")
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(10)
                run.font.color.rgb = RGBColor(255, 255, 255)

    comparisons = [
        ("System Prompt Instructions ('Please be safe')", "Deterministic Code Boundary: Execution fails closed unless hard-coded policy returns ALLOW."),
        ("Second LLM as a Guardrail (Probabilistic, slow, easily bypassable)", "Zero LLM Self-Authorization: LLM output is treated as untrusted user input; code decides permissions."),
        ("Errors cause LLM to hallucinate or bypass checks", "Fail-Closed Architecture: Unknown tools, schema mismatches, or crashes immediately default to DENY."),
        ("Sensitive actions run without oversight", "Cryptographic Single-Use Approval: High-risk actions require HMAC-SHA256 human approval tokens."),
        ("No tamper-evident record of decisions", "Immutable Append-Only Audit Trail: Every call logged with SHA-256 hashes and recursive secret scrubbing.")
    ]

    for flawed, solution in comparisons:
        row = table.add_row().cells
        row[0].text = flawed
        row[1].text = solution
        set_cell_background(row[0], "f8fafc")
        set_cell_background(row[1], "ecfdf5")
        for cell in row:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(9.5)

    # Section 3: Architecture & 9-Step Pipeline
    add_custom_heading("3. The 9-Step Deterministic Policy Pipeline")
    doc.add_paragraph(
        "Every tool invocation dispatched by an agent traverses a strict, non-negotiable 9-step evaluation pipeline before execution:"
    )
    pipeline_steps = [
        "1. Tool Registration Check: Unregistered or shadow tools are rejected immediately (Fail-Closed).",
        "2. Policy Binding Verification: Guarantees agent is bound to an active declarative policy schema.",
        "3. Explicit Deny Rules: High-precedence explicit blacklist evaluation (e.g. drop database, shell execute).",
        "4. Explicit Allow Rules: Checks whitelist for approved, safe actions.",
        "5. Human Approval Requirement: Flags sensitive actions for single-use cryptographic token authorization.",
        "6. Sensitivity Ceiling: Rejects actions exceeding the maximum numerical sensitivity threshold.",
        "7. Heuristic Risk Engine: Calculates composite risk scores (target, environment, payload). Rejects if score > 0.8.",
        "8. Recipient Domain Whitelist: Uses wildcard glob matching to stop data exfiltration (e.g. *@company.com only).",
        "9. Resource Path Glob Matching: Prevents path traversal and directory escape attacks (e.g. /data/inbox/* only)."
    ]
    for step in pipeline_steps:
        p = doc.add_paragraph(step, style='List Bullet')
        p.paragraph_format.space_after = Pt(2)

    # Section 4: Threat Model & Penetration Testing
    add_custom_heading("4. The 15 Threat Vectors Defeated (Automated Pentest Suite)")
    doc.add_paragraph(
        "IntentLock features an automated penetration test suite (test_threat_model_pentest.py) proving mitigations for all 15 threat vectors in THREAT_MODEL.md:"
    )

    t_table = doc.add_table(rows=1, cols=3)
    t_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_hdr = t_table.rows[0].cells
    t_hdr[0].text = "Threat ID & Attack Vector"
    t_hdr[1].text = "Attacker Behavior / Payload"
    t_hdr[2].text = "IntentLock Defense Outcome"
    for cell in t_hdr:
        set_cell_background(cell, "0d1b2a")
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(255, 255, 255)

    threats = [
        ("T-01: Prompt Injection Bypass", "SQL injection injected via user prompt (DROP TABLE users;--)", "BLOCKED (Evaluated in code)"),
        ("T-02: Shadow Tool Execution", "Agent attempts to call undeclared tool os_system", "BLOCKED (ToolNotRegisteredError)"),
        ("T-03: Path Traversal", "Relative path escape (../../etc/shadow)", "BLOCKED (Glob boundary violation)"),
        ("T-04: Recipient Exfiltration", "Sending company records to hacker@evil-drop.net", "BLOCKED (Domain whitelist violation)"),
        ("T-05: Unauthorized Payments", "$50,000 wire transfer without human approval", "BLOCKED (Escalates to ApprovalRequired)"),
        ("T-06: Approval Replay Attack", "Re-submitting previously approved token for 2nd transfer", "BLOCKED (ApprovalReplayError)"),
        ("T-07: Rate Limit Exhaustion", "Burst of high-frequency tool requests", "BLOCKED (Token-bucket rate limiter)"),
        ("T-08: Credential Leakage in Logs", "Raw API keys (sk-live-...) passed in parameters", "REDACTED ([REDACTED] in audit log)"),
        ("T-09: Malformed Parameter Injection", "Passing string in integer price field", "BLOCKED (ArgumentValidationError)"),
        ("T-10: Scope Escalation", "Accessing /reports/q4/ from /reports/q1/* policy", "BLOCKED (Wildcard scope violation)"),
        ("T-11: Gateway Bypass", "Attempting direct tool invocation around gateway", "PREVENTED (Protected handler boundary)"),
        ("T-12: Nonce Substitution", "Forging approval token with altered action hash", "BLOCKED (HMAC signature mismatch)"),
        ("T-13: Expired Approval Token", "Submitting approval token after TTL expiry", "BLOCKED (ApprovalExpiredError)"),
        ("T-14: Fail-Closed on Crash", "Tool handler raises unexpected Python runtime crash", "FAIL-CLOSED (Action safely DENIED)"),
        ("T-15: MCP Protocol Injection", "Sending unauthorized JSON-RPC method to MCP proxy", "BLOCKED (Standard -32601 Error)")
    ]

    for tid, payload, outcome in threats:
        r = t_table.add_row().cells
        r[0].text = tid
        r[1].text = payload
        r[2].text = outcome
        set_cell_background(r[0], "f8fafc")
        set_cell_background(r[1], "ffffff")
        set_cell_background(r[2], "ecfdf5")
        for cell in r:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(8.5)

    # Section 5: Demonstration Script
    add_custom_heading("5. Step-by-Step Live Demonstration Script")
    steps_demo = [
        ("Step 1: Terminal Email Agent Demo",
         "Run: python examples/email_agent/demo.py\n"
         "Highlights: Tool 1 reads inbox email (ALLOW); Tool 2 attempts ../../etc/shadow path traversal (DENY); "
         "Tool 3 attempts exfiltration email to external hacker (DENY); Tool 4 attempts $450 refund and halts for cryptographic human approval (REQUIRE_APPROVAL)."),
        ("Step 2: Automated Penetration Suite",
         "Run: pytest sdk/python/tests/test_threat_model_pentest.py -v\n"
         "Highlights: 15 automated attacks against the gateway executed in 0.4 seconds with 100% defense success rate."),
        ("Step 3: Security Operations Center Dashboard",
         "Run Backend: uvicorn app.main:app --port 8000\n"
         "Run Frontend: npm run dev (http://localhost:3000)\n"
         "Highlights: Live telemetry metrics, 15/15 Threat Matrix status strip, 1-click Approval Queue, and real-time Intercept Playground.")
    ]
    for title, desc in steps_demo:
        add_custom_heading(title, level=2)
        p = doc.add_paragraph(desc)
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)

    # Section 6: Viva Defense Q&A
    add_custom_heading("6. Top Viva Examination Questions & Winning Answers")
    viva_qa = [
        ("Q1: Why not just instruct the LLM in its system prompt to be secure?",
         "Answer: System prompts and user inputs share the exact same context window and token stream in transformer models. "
         "Attackers exploit this via indirect prompt injection, linguistic obfuscation, and context confusion. "
         "IntentLock works because it is out-of-band: security rules are enforced deterministically in Python code where the LLM has zero authority."),
        ("Q2: How does IntentLock prevent token replay attacks?",
         "Answer: Approval tokens are HMAC-SHA256 digests bound to the canonical action hash, a unique cryptographic nonce, and a strict 5-minute TTL. "
         "The instant an approval token is submitted to execute an action, IntentLock invalidates it in memory and in the database. A second execution attempt results in ApprovalReplayError."),
        ("Q3: What is the 'Fail-Closed' guarantee?",
         "Answer: If an unknown tool is invoked, if arguments don't match the schema, if database connectivity drops, or if an unexpected exception occurs, "
         "IntentLock defaults to DENY. Tools only run upon an explicit, cryptographically verified ALLOW."),
        ("Q4: How does IntentLock integrate with existing AI frameworks?",
         "Answer: IntentLock provides drop-in wrappers with zero code refactoring: SecureTool for LangChain/LangGraph, and MCPSecurityProxy for the Model Context Protocol (MCP).")
    ]
    for q, a in viva_qa:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(6)
        r_q = p_q.add_run(q)
        r_q.bold = True
        r_q.font.size = Pt(10)
        r_q.font.color.rgb = COLOR_NAVY

        p_a = doc.add_paragraph()
        p_a.paragraph_format.left_indent = Inches(0.2)
        p_a.paragraph_format.space_after = Pt(4)
        r_a = p_a.add_run(a)
        r_a.font.size = Pt(9.5)

    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

def generate_pdf(output_path: str):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=18, leading=22,
        textColor=colors.HexColor('#0d1b2a'), spaceAfter=4
    )
    meta_style = ParagraphStyle(
        'DocMeta', parent=styles['Normal'],
        fontName='Helvetica-Oblique', fontSize=9, leading=12,
        textColor=colors.HexColor('#475569'), spaceAfter=14
    )
    h1_style = ParagraphStyle(
        'H1', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=13, leading=16,
        textColor=colors.HexColor('#0d1b2a'), spaceBefore=12, spaceAfter=6
    )
    h2_style = ParagraphStyle(
        'H2', parent=styles['Heading3'],
        fontName='Helvetica-Bold', fontSize=10.5, leading=14,
        textColor=colors.HexColor('#10b981'), spaceBefore=8, spaceAfter=4
    )
    body_style = ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=colors.HexColor('#1e293b'), spaceAfter=4
    )
    pitch_style = ParagraphStyle(
        'PitchBox', parent=styles['Normal'],
        fontName='Helvetica-Oblique', fontSize=9, leading=13,
        textColor=colors.HexColor('#0d1b2a'), backColor=colors.HexColor('#f1f5f9'),
        borderPadding=8, spaceAfter=10
    )
    table_text = ParagraphStyle(
        'TableText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7.5, leading=10,
        textColor=colors.HexColor('#1e293b')
    )
    table_header = ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, leading=11,
        textColor=colors.white
    )

    story = []

    # Title & Header
    story.append(Paragraph("BSc IT FINAL YEAR ENGINEERING PROJECT | VIVA & INDUSTRY DEFENSE GUIDE", h2_style))
    story.append(Paragraph("INTENTLOCK: AI Agent Security Middleware & Developer SDK", title_style))
    story.append(Paragraph("Author: Divy Bhanushali &bull; Status: Production Ready (88/88 Automated Tests Passed &bull; 15/15 Threat Vectors Blocked)", meta_style))

    # Section 1: Executive Summary & Elevator Pitch
    story.append(Paragraph("1. Executive Summary & 30-Second Elevator Pitch", h1_style))
    pitch_text = (
        "\"Autonomous AI agents are being connected directly to enterprise file systems, databases, emails, and payment APIs. "
        "However, Large Language Models are fundamentally non-deterministic and vulnerable to prompt injection attacks.<br/><br/>"
        "Today's industry standard is using 'system prompts' or a second LLM to police the first LLM. That is like asking one thief to watch another thief.<br/><br/>"
        "<b>INTENTLOCK</b> is an out-of-band, code-level Security Middleware and Python Developer SDK. It sits at the execution boundary between the AI agent "
        "and real-world tools. Every tool call is intercepted and deterministically evaluated against hard-coded policy rules, single-use cryptographic approvals, "
        "and an append-only audit trail before any code can execute. <b>We don't trust the AI to secure the AI. We enforce Zero Trust in code.</b>\""
    )
    story.append(Paragraph(pitch_text, pitch_style))

    # Section 2: Problem vs Solution
    story.append(Paragraph("2. The Problem vs. IntentLock Solution", h1_style))
    p_data = [
        [Paragraph("Industry's Flawed Approach", table_header), Paragraph("IntentLock Zero-Trust Middleware", table_header)],
        [Paragraph("System Prompt Instructions ('Please don't delete files')", table_text), Paragraph("Deterministic Code Boundary: Execution fails closed unless hard-coded policy returns ALLOW.", table_text)],
        [Paragraph("Second LLM as Guardrail (Probabilistic, slow, bypassable)", table_text), Paragraph("Zero LLM Trust: LLM output is untrusted input; hard rules decide permissions.", table_text)],
        [Paragraph("Errors cause agent to hallucinate or bypass checks", table_text), Paragraph("Fail-Closed Architecture: Unknown tools, bad schema, or crashes immediately default to DENY.", table_text)],
        [Paragraph("Sensitive actions run automatically without oversight", table_text), Paragraph("Cryptographic Approvals: High-risk actions require single-use HMAC-SHA256 human tokens.", table_text)],
        [Paragraph("No tamper-evident record of actions", table_text), Paragraph("Immutable Audit Log: Every call logged with SHA-256 hashes and secret redaction.", table_text)]
    ]
    t1 = Table(p_data, colWidths=[240, 290])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0d1b2a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,1), (0,-1), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (1,1), (1,-1), colors.HexColor('#ecfdf5')),
    ]))
    story.append(t1)
    story.append(Spacer(1, 10))

    # Section 3: 9-Step Policy Pipeline
    story.append(Paragraph("3. The 9-Step Deterministic Policy Pipeline", h1_style))
    steps = [
        "<b>1. Tool Registration Check:</b> Unregistered tools rejected immediately (Fail-Closed).",
        "<b>2. Policy Binding Verification:</b> Ensures agent is bound to an active security policy.",
        "<b>3. Explicit Deny Rules:</b> High-precedence explicit blacklist evaluation (e.g. drop database).",
        "<b>4. Explicit Allow Rules:</b> Checks whitelist for pre-approved safe actions.",
        "<b>5. Human Approval Requirement:</b> Flags sensitive actions for single-use cryptographic token authorization.",
        "<b>6. Sensitivity Ceiling:</b> Rejects actions exceeding numerical sensitivity limits.",
        "<b>7. Heuristic Risk Engine:</b> Composite risk scoring based on payload and context (rejects if > 0.8).",
        "<b>8. Recipient Domain Whitelist:</b> Wildcard glob matching prevents data exfiltration (e.g. *@company.com).",
        "<b>9. Resource Path Glob Matching:</b> Prevents path traversal and directory escape attacks (e.g. /data/inbox/*)."
    ]
    for s in steps:
        story.append(Paragraph(f"&bull; {s}", body_style))

    # Section 4: 15 Threat Vectors Defeated
    story.append(Spacer(1, 8))
    story.append(Paragraph("4. The 15 Threat Vectors Defeated (test_threat_model_pentest.py)", h1_style))
    
    threat_data = [
        [Paragraph("Threat ID & Vector", table_header), Paragraph("Attack Behavior / Payload", table_header), Paragraph("Defense Outcome", table_header)],
        [Paragraph("T-01: Prompt Injection", table_text), Paragraph("SQL injection in prompt (DROP TABLE users;--)", table_text), Paragraph("BLOCKED (Deterministic Policy)", table_text)],
        [Paragraph("T-02: Shadow Tools", table_text), Paragraph("Undeclared tool invocation os_system", table_text), Paragraph("BLOCKED (ToolNotRegisteredError)", table_text)],
        [Paragraph("T-03: Path Traversal", table_text), Paragraph("Relative path escape (../../etc/shadow)", table_text), Paragraph("BLOCKED (Glob Boundary Check)", table_text)],
        [Paragraph("T-04: Data Exfiltration", table_text), Paragraph("Email to hacker@evil-drop.net", table_text), Paragraph("BLOCKED (Domain Whitelist)", table_text)],
        [Paragraph("T-05: Unauthorized Payments", table_text), Paragraph("$50,000 wire transfer without token", table_text), Paragraph("BLOCKED (Escalates to Approval)", table_text)],
        [Paragraph("T-06: Approval Token Replay", table_text), Paragraph("Reusing single-use token for 2nd transfer", table_text), Paragraph("BLOCKED (ApprovalReplayError)", table_text)],
        [Paragraph("T-07: Rate Exhaustion DoS", table_text), Paragraph("Burst of high-frequency tool invocations", table_text), Paragraph("BLOCKED (Rate Limiter)", table_text)],
        [Paragraph("T-08: Credential Leakage", table_text), Paragraph("Raw API keys (sk-live-...) in parameters", table_text), Paragraph("REDACTED ([REDACTED] in logs)", table_text)],
        [Paragraph("T-09: Parameter Injection", table_text), Paragraph("String in integer price parameter", table_text), Paragraph("BLOCKED (ArgumentValidationError)", table_text)],
        [Paragraph("T-10: Scope Escalation", table_text), Paragraph("Accessing /reports/q4/ from /reports/q1/*", table_text), Paragraph("BLOCKED (Wildcard Glob Violation)", table_text)],
        [Paragraph("T-11: Gateway Bypass", table_text), Paragraph("Invoking tool directly around gateway", table_text), Paragraph("PREVENTED (Protected boundary)", table_text)],
        [Paragraph("T-12: Nonce Substitution", table_text), Paragraph("Forging token with altered action hash", table_text), Paragraph("BLOCKED (HMAC mismatch)", table_text)],
        [Paragraph("T-13: Expired Token Use", table_text), Paragraph("Submitting token after TTL expiry", table_text), Paragraph("BLOCKED (ApprovalExpiredError)", table_text)],
        [Paragraph("T-14: Fail-Closed on Crash", table_text), Paragraph("Tool raises unexpected runtime crash", table_text), Paragraph("FAIL-CLOSED (Action DENIED)", table_text)],
        [Paragraph("T-15: MCP Protocol Attack", table_text), Paragraph("Unauthorized JSON-RPC method to MCP proxy", table_text), Paragraph("BLOCKED (Standard -32601 Error)", table_text)]
    ]
    t2 = Table(threat_data, colWidths=[130, 250, 150])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0d1b2a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,1), (0,-1), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (2,1), (2,-1), colors.HexColor('#ecfdf5')),
    ]))
    story.append(t2)

    # Section 5: Demonstration Script
    story.append(Spacer(1, 10))
    story.append(Paragraph("5. Step-by-Step Live Demonstration Script", h1_style))
    story.append(Paragraph("<b>Step 1: Terminal Email Agent Demo</b> (<code>python examples/email_agent/demo.py</code>)<br/>"
                           "Demonstrates ALLOW on inbox reads, DENY on path traversal (../../etc/shadow), DENY on exfiltration emails, and REQUIRE_APPROVAL for $450 refunds.", body_style))
    story.append(Paragraph("<b>Step 2: Automated Pentest Suite</b> (<code>pytest sdk/python/tests/test_threat_model_pentest.py -v</code>)<br/>"
                           "Executes 15 synthetic cyber attacks against the gateway in 0.42 seconds with 100% defense rate.", body_style))
    story.append(Paragraph("<b>Step 3: Security Operations Center Dashboard</b> (<code>http://localhost:3000</code>)<br/>"
                           "Real-time telemetry metrics, 15/15 Threat Matrix status strip, 1-click Approval Queue, and live Intercept Playground.", body_style))

    # Section 6: Top Viva Q&A
    story.append(Spacer(1, 10))
    story.append(Paragraph("6. Top Viva Examination Questions & Winning Answers", h1_style))
    qas = [
        ("Q1: Why not just instruct the LLM in its system prompt to be secure?",
         "Answer: System prompts share the context window with untrusted user inputs. Attackers exploit this via indirect prompt injection and jailbreaks. IntentLock enforces security out-of-band in deterministic Python code where the LLM has zero authority."),
        ("Q2: How does IntentLock prevent token replay attacks?",
         "Answer: Approval tokens are HMAC-SHA256 digests bound to the action hash, a unique nonce, and a 5-minute TTL. Once submitted, the token is permanently invalidated in memory and database; replay attempts trigger ApprovalReplayError."),
        ("Q3: What is the 'Fail-Closed' guarantee?",
         "Answer: Any unknown tool, invalid parameter, or unexpected crash immediately defaults to DENY. Tools only run upon an explicit, verified ALLOW."),
        ("Q4: How does IntentLock integrate with modern agent frameworks?",
         "Answer: Provides drop-in wrappers: SecureTool for LangChain/LangGraph, and MCPSecurityProxy for the Model Context Protocol (MCP).")
    ]
    for q, a in qas:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(a, body_style))

    doc.build(story)
    print(f"Successfully generated PDF at: {output_path}")

if __name__ == "__main__":
    workspace_root = r"c:\Users\divyb\OneDrive\Desktop\TYIT FInal Year Project"
    docx_file = os.path.join(workspace_root, "INTENTLOCK_Master_Pitch_and_Defense_Guide.docx")
    pdf_file = os.path.join(workspace_root, "INTENTLOCK_Master_Pitch_and_Defense_Guide.pdf")

    generate_docx(docx_file)
    generate_pdf(pdf_file)
    print("ALL DOCUMENTS GENERATED SUCCESSFULLY!")

