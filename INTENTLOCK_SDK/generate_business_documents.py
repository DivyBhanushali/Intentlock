# INTENTLOCK — Business, Product & Commercialization Generator
import os
import sys

def generate_business_docx(output_path: str):
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

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

    # Document Header
    p_top = doc.add_paragraph()
    r_sub = p_top.add_run("COMMERCIALIZATION & PRODUCT STRATEGY REPORT\n")
    r_sub.font.size = Pt(9.5)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_EMERALD

    r_title = p_top.add_run("INTENTLOCK: Product Identity, Value Proposition & Enterprise Pricing Strategy\n")
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_NAVY

    r_meta = p_top.add_run("Author: Divy Bhanushali | Target Audience: Investors, Evaluators, Enterprise Clients")
    r_meta.font.size = Pt(10)
    r_meta.font.italic = True
    r_meta.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

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
            run.font.size = Pt(11.5)
            run.font.color.rgb = COLOR_EMERALD
        return h

    # Section 1: What is IntentLock
    add_custom_heading("1. What Actually is IntentLock?")
    doc.add_paragraph(
        "INTENTLOCK is an out-of-band, code-level Security Middleware and Developer SDK engineered to solve the single largest "
        "barrier to enterprise AI adoption: the unreliability and exploitability of autonomous Large Language Model tool execution.\n\n"
        "In plain English, IntentLock acts as a deterministic firewall and Zero-Trust Identity & Access Management (IAM) layer "
        "specifically built for AI agents. When an AI bot attempts to read a file, query a database, send an email, or execute a wire transfer, "
        "IntentLock intercepts the function call and evaluates it against mathematically verifiable policy rules before any real-world code can run. "
        "The AI is never trusted to police itself."
    )

    # Section 2: How it Helps
    add_custom_heading("2. How It Helps Organizations (Value Proposition & ROI)")
    t_roi = doc.add_table(rows=1, cols=3)
    t_roi.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_hdr = t_roi.rows[0].cells
    t_hdr[0].text = "Stakeholder"
    t_hdr[1].text = "Core Vulnerability / Risk"
    t_hdr[2].text = "IntentLock Business Value"
    for cell in t_hdr:
        set_cell_background(cell, "0d1b2a")
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(255, 255, 255)

    roi_data = [
        ("Chief Information Security Officer (CISO)", "AI prompt injection leaks customer PII or API credentials, causing multi-million dollar regulatory fines.", "Zero-Trust execution barrier physically blocks path traversal, unauthorized exfiltration domains, and credential leaks."),
        ("Chief Technology Officer (CTO)", "Engineering teams waste months building custom security checks for every tool, slowing down AI deployment.", "Developer-friendly SDK wraps LangChain and MCP tools in 3 lines of code with instant out-of-the-box protection."),
        ("Compliance & Legal Counsel", "Violations of EU AI Act, SOC 2, or HIPAA due to non-deterministic, unauditable agent actions.", "Tamper-evident, append-only audit trail with SHA-256 action hashes and automatic secret redaction."),
        ("FinTech / Product Leaders", "Autonomous support agent erroneously issues excessive customer refunds or deletes accounts.", "Cryptographic single-use HMAC-SHA256 human approvals halt high-risk transactions until human sign-off.")
    ]
    for role, risk, sol in roi_data:
        r = t_roi.add_row().cells
        r[0].text = role
        r[1].text = risk
        r[2].text = sol
        set_cell_background(r[0], "f8fafc")
        set_cell_background(r[1], "ffffff")
        set_cell_background(r[2], "ecfdf5")
        for cell in r:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(8.5)

    # Section 3: Where to Sell
    add_custom_heading("3. Target Customer Segments & Market Opportunities")
    markets = [
        ("1. FinTech & E-Commerce Platforms (Highest Urgency)", 
         "Companies connecting AI agents to payment gateways (Stripe, PayPal, internal ledgers) and automated refund desks. A single prompt injection refund exploit costs thousands of dollars."),
        ("2. Enterprise B2B SaaS Providers", 
         "Companies building 'AI Co-Pilots' for CRM, HR, or ERP systems. Corporate enterprise buyers mandate SOC2 compliance and IAM boundaries before buying AI software."),
        ("3. Healthcare & HealthTech", 
         "Telehealth and clinic automation tools processing patient records. Strict HIPAA guidelines mandate deterministic data boundaries."),
        ("4. Internal Enterprise DevOps & Cloud IT", 
         "Engineering teams using AI agents to query production databases or manage cloud infrastructure. Prevents catastrophic DROP TABLE or delete commands.")
    ]
    for m_title, m_desc in markets:
        add_custom_heading(m_title, level=2)
        p = doc.add_paragraph(m_desc)
        p.paragraph_format.left_indent = Inches(0.2)

    # Section 4: Commercial Pricing Models
    add_custom_heading("4. Commercial Pricing Models (Subscription vs. License)")
    doc.add_paragraph(
        "IntentLock can be monetized through two primary revenue channels depending on the customer's infrastructure requirements:"
    )

    add_custom_heading("Channel A: Developer SaaS Cloud Subscription (Monthly / Annual Recurring)", level=2)
    t_saas = doc.add_table(rows=1, cols=4)
    t_saas.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_hdr = t_saas.rows[0].cells
    s_hdr[0].text = "Tier"
    s_hdr[1].text = "Pricing"
    s_hdr[2].text = "Interceptions / Limits"
    s_hdr[3].text = "Included Features"
    for cell in s_hdr:
        set_cell_background(cell, "0d1b2a")
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(255, 255, 255)

    saas_tiers = [
        ("Developer / Free", "$0 / month", "Up to 25,000 calls/mo (1 Agent)", "Open-source Python SDK, local policy engine, community support."),
        ("Team / Growth", "$149 / month", "Up to 500,000 calls/mo (5 Agents)", "Hosted Security Dashboard, email approval alerts, 30-day audit log."),
        ("Business / Scale", "$499 / month", "Up to 2,500,000 calls/mo (Unlimited)", "Slack/Teams triage, 90-day immutable audit logs, LangChain & MCP proxies."),
        ("Enterprise Cloud", "$1,500 – $3,500 / mo", "Over 10M calls/mo", "Dedicated cluster, 99.99% uptime SLA, SOC2 export package, priority support.")
    ]
    for t_name, price, limit, feat in saas_tiers:
        r = t_saas.add_row().cells
        r[0].text = t_name
        r[1].text = price
        r[2].text = limit
        r[3].text = feat
        set_cell_background(r[0], "f8fafc")
        set_cell_background(r[1], "ecfdf5")
        set_cell_background(r[2], "ffffff")
        set_cell_background(r[3], "ffffff")
        for cell in r:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(8.5)

    add_custom_heading("Channel B: On-Premise / Self-Hosted Enterprise License (Air-Gapped & Banks)", level=2)
    doc.add_paragraph(
        "For banking, defense, and healthcare clients who cannot send telemetry data to an external SaaS cloud:\n"
        "• Node / Per-Agent License: $1,800 to $3,600 / year per active agent instance deployed in customer's VPC.\n"
        "• Enterprise Site License: $25,000 to $65,000 / year for unlimited agents, complete Kubernetes / Docker deployment, and dedicated security support."
    )

    # Section 5: Go-to-market
    add_custom_heading("5. Go-to-Market (GTM) Strategy")
    gtm_points = [
        "1. Open-Core Model: Python SDK is MIT open-source on PyPI (pip install intentlock). Developers adopt it for free, then upgrade to paid SaaS for the dashboard and multi-user approvals.",
        "2. Framework Partner Integration: Certified listing on LangChain and Anthropic Model Context Protocol (MCP) tool directories.",
        "3. AI Development Agencies: Partnering with digital agencies building AI bots for corporate clients, offering a 20% recurring affiliate margin for embedding IntentLock into client projects."
    ]
    for pt in gtm_points:
        p = doc.add_paragraph(pt)
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(3)

    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

def generate_business_pdf(output_path: str):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
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
        fontName='Helvetica-Bold', fontSize=12.5, leading=16,
        textColor=colors.HexColor('#0d1b2a'), spaceBefore=10, spaceAfter=4
    )
    h2_style = ParagraphStyle(
        'H2', parent=styles['Heading3'],
        fontName='Helvetica-Bold', fontSize=10, leading=13,
        textColor=colors.HexColor('#10b981'), spaceBefore=6, spaceAfter=3
    )
    body_style = ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8, leading=11.5,
        textColor=colors.HexColor('#1e293b'), spaceAfter=3
    )
    table_text = ParagraphStyle(
        'TableText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7.5, leading=9.5,
        textColor=colors.HexColor('#1e293b')
    )
    table_header = ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=7.5, leading=10,
        textColor=colors.white
    )

    story = []

    story.append(Paragraph("COMMERCIALIZATION & PRODUCT STRATEGY REPORT", h2_style))
    story.append(Paragraph("INTENTLOCK: Product Identity, Value Proposition & Enterprise Pricing Strategy", title_style))
    story.append(Paragraph("Author: Divy Bhanushali &bull; Target Audience: Investors, Evaluators, Enterprise Clients", meta_style))

    story.append(Paragraph("1. What Actually is IntentLock?", h1_style))
    story.append(Paragraph(
        "<b>INTENTLOCK</b> is an out-of-band, code-level Security Middleware and Developer SDK engineered to solve the single largest "
        "barrier to enterprise AI adoption: the unreliability and exploitability of autonomous Large Language Model tool execution.<br/><br/>"
        "In plain English, IntentLock acts as a deterministic firewall and Zero-Trust Identity & Access Management (IAM) layer "
        "specifically built for AI agents. When an AI bot attempts to read a file, query a database, send an email, or execute a wire transfer, "
        "IntentLock intercepts the function call and evaluates it against mathematically verifiable policy rules before any real-world code can run. "
        "The AI is never trusted to police itself.",
        body_style
    ))

    story.append(Paragraph("2. How It Helps Organizations (Value Proposition & ROI)", h1_style))
    roi_data = [
        [Paragraph("Stakeholder", table_header), Paragraph("Core Vulnerability / Risk", table_header), Paragraph("IntentLock Business Value", table_header)],
        [Paragraph("CISO", table_text), Paragraph("Prompt injection leaks customer PII or API credentials, causing massive regulatory fines.", table_text), Paragraph("Zero-Trust boundary blocks path traversal, unauthorized domains, and credential leaks.", table_text)],
        [Paragraph("CTO", table_text), Paragraph("Teams waste months building custom security checks for every tool.", table_text), Paragraph("SDK wraps LangChain & MCP tools in 3 lines of code with instant protection.", table_text)],
        [Paragraph("Compliance", table_text), Paragraph("Violating EU AI Act, SOC2, or HIPAA due to unauditable AI actions.", table_text), Paragraph("Tamper-evident audit trail with SHA-256 action hashes and automatic secret redaction.", table_text)],
        [Paragraph("FinTech Leads", table_text), Paragraph("Support agent erroneously issues excessive customer refunds.", table_text), Paragraph("Single-use HMAC-SHA256 human approvals halt high-risk transactions until human sign-off.", table_text)]
    ]
    t1 = Table(roi_data, colWidths=[90, 210, 230])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0d1b2a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,1), (0,-1), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (2,1), (2,-1), colors.HexColor('#ecfdf5')),
    ]))
    story.append(t1)

    story.append(Spacer(1, 6))
    story.append(Paragraph("3. Target Customer Segments & Market Opportunities", h1_style))
    story.append(Paragraph("<b>1. FinTech & E-Commerce:</b> High urgency; AI agents handling refunds and balance queries can be drained by prompt injections.", body_style))
    story.append(Paragraph("<b>2. Enterprise B2B SaaS:</b> Software vendors adding AI Co-Pilots need SOC2 compliance and IAM boundaries to sell to corporate buyers.", body_style))
    story.append(Paragraph("<b>3. Healthcare:</b> Telehealth platforms automating clinical notes must adhere to strict HIPAA data exfiltration rules.", body_style))
    story.append(Paragraph("<b>4. Enterprise DevOps:</b> Internal bots executing SQL or cloud commands are guarded against destructive operations.", body_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("4. Commercial Pricing Models (Subscription vs. License)", h1_style))
    story.append(Paragraph("<b>Channel A: Developer SaaS Cloud Subscription (Monthly / Annual Recurring)</b>", h2_style))

    saas_data = [
        [Paragraph("Tier", table_header), Paragraph("Pricing", table_header), Paragraph("Interception Limits", table_header), Paragraph("Key Features", table_header)],
        [Paragraph("Developer", table_text), Paragraph("$0 / mo", table_text), Paragraph("Up to 25,000 / mo", table_text), Paragraph("Open-source Python SDK, local policy engine, community support.", table_text)],
        [Paragraph("Team", table_text), Paragraph("$149 / mo", table_text), Paragraph("Up to 500,000 / mo", table_text), Paragraph("Hosted Security Dashboard, email approval alerts, 30-day audit log.", table_text)],
        [Paragraph("Business", table_text), Paragraph("$499 / mo", table_text), Paragraph("Up to 2,500,000 / mo", table_text), Paragraph("Slack/Teams triage, 90-day immutable logs, LangChain & MCP proxies.", table_text)],
        [Paragraph("Enterprise", table_text), Paragraph("$1,500 – $3,500 / mo", table_text), Paragraph(">10,000,000 / mo", table_text), Paragraph("Dedicated cluster, 99.99% SLA, SOC2 exports, priority support.", table_text)]
    ]
    t2 = Table(saas_data, colWidths=[70, 80, 120, 260])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0d1b2a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,1), (0,-1), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (1,1), (1,-1), colors.HexColor('#ecfdf5')),
    ]))
    story.append(t2)

    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Channel B: Self-Hosted Enterprise License (Air-Gapped & Banks)</b>", h2_style))
    story.append(Paragraph("&bull; <b>Per-Agent Node License:</b> $1,800 to $3,600 / year per active agent in customer VPC.", body_style))
    story.append(Paragraph("&bull; <b>Enterprise Site License:</b> $25,000 to $65,000 / year for unlimited agents, Kubernetes Helm charts, and custom policy rules.", body_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("5. Go-To-Market Strategy", h1_style))
    story.append(Paragraph("<b>1. Open-Core:</b> Open-source SDK drives developer adoption; hosted dashboard & team approvals drive monetization.", body_style))
    story.append(Paragraph("<b>2. Framework Ecosystems:</b> Certified listing on LangChain and Anthropic MCP directories.", body_style))
    story.append(Paragraph("<b>3. Agency Partnerships:</b> 20% recurring margin for software agencies embedding IntentLock into client AI deliverables.", body_style))

    doc.build(story)
    print(f"Successfully generated PDF at: {output_path}")

if __name__ == "__main__":
    workspace_root = r"c:\Users\divyb\OneDrive\Desktop\TYIT FInal Year Project"
    docx_file = os.path.join(workspace_root, "INTENTLOCK_Business_and_Commercialization_Plan.docx")
    pdf_file = os.path.join(workspace_root, "INTENTLOCK_Business_and_Commercialization_Plan.pdf")

    generate_business_docx(docx_file)
    generate_business_pdf(pdf_file)
    print("ALL BUSINESS DOCUMENTS GENERATED SUCCESSFULLY!")

