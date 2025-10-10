#!/usr/bin/env python3

import argparse
import json
import os
import re
from typing import List, Dict, Any

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None


def extract_pdf_text(pdf_path: str) -> str:
    """
    Extract text from a PDF file using pypdf
    """
    if PdfReader is None:
        return "pypdf not available"
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"


def normalize_text(text: str) -> str:
    # Normalize whitespace and special separators
    text = text.replace("\u2013", "-")  # en dash to hyphen
    text = text.replace("\u2014", "-")  # em dash to hyphen
    text = re.sub(r"[\t\r]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def parse_emails(s: str) -> List[str]:
    candidates = [e.strip() for e in re.split(r"[,|]", s) if e.strip()]
    # Basic email filter
    return [c for c in candidates if re.search(r"@", c)]


def parse_resume_text_to_data(text: str, existing: Dict[str, Any]) -> Dict[str, Any]:
    """Parse latest_resume_text.txt to update fields in existing resume-data.json structure."""
    data = json.loads(json.dumps(existing))  # deep copy via json

    norm = normalize_text(text)

    # Personal Info
    # Name
    name_match = re.search(r"\bSurender\s+Gyanmote\b", norm, re.IGNORECASE)
    if name_match:
        data.setdefault("personalInfo", {})["name"] = "Surender Gyanmote"

    # Phone
    phone_match = re.search(r"Phone:\s*([+()\-\dxX\s]+)", norm)
    if phone_match:
        phone = phone_match.group(1).strip()
        # Normalize X casing
        phone = phone.replace("x", "X")
        data["personalInfo"]["phone"] = phone if phone.startswith("+") else f"+1-{phone}" if re.search(r"\d", phone) else phone

    # Email
    email_match = re.search(r"Email:\s*([^\n]+)", norm)
    if email_match:
        emails = parse_emails(email_match.group(1))
        if emails:
            data["personalInfo"]["email"] = emails

    # LinkedIn
    li_match = re.search(r"LinkedIn:\s*(https?://\S+)", norm)
    if li_match:
        data["personalInfo"]["linkedin"] = li_match.group(1)

    # Title
    title_match = re.search(r"Security\s*Program\s*Manager\|Cloud\s*Solutions,\s*Database,\s*Gen\s*AI\s*Architect", norm, re.IGNORECASE)
    if title_match:
        data["personalInfo"]["title"] = "Security Program Manager | Cloud Solutions, Database, Gen AI Architect"

    # Summary: capture text between title and first bullet (✓) or PROFESSIONAL EXPERIENCE
    summary = None
    title_idx = norm.lower().find("security program manager|cloud solutions, database, gen ai architect".lower())
    if title_idx != -1:
        tail = norm[title_idx + len("Security Program Manager|Cloud Solutions, Database, Gen AI Architect"):]
        end_pos = len(tail)
        bullet_pos = tail.find("✓")
        exp_pos = tail.lower().find("professional experience")
        if bullet_pos != -1:
            end_pos = min(end_pos, bullet_pos)
        if exp_pos != -1:
            end_pos = min(end_pos, exp_pos)
        summary_block = tail[:end_pos].strip()
        # Clean excessive spaces
        summary = re.sub(r"\s+", " ", summary_block)
    if summary:
        data["personalInfo"]["summary"] = summary

    # Experience: locate section and parse first role line
    exp_section_match = re.search(r"professional\s+experience\s+(.*?)\s+projects", norm, re.IGNORECASE)
    achievements: List[str] = []
    if exp_section_match:
        exp_section = exp_section_match.group(1).strip()
        # Role line with company, title, and period
        role_line_match = re.search(r"(Oracle\s+Corp)\s*[-–]\s*(.*?)\s+(Sep\s*\d{4}\s*[-–]\s*\w+\s*\d{4})", exp_section, re.IGNORECASE)
        if role_line_match:
            company = role_line_match.group(1).strip()
            title = role_line_match.group(2).strip()
            period = role_line_match.group(3).strip()
            if isinstance(data.get("experience"), list) and data["experience"]:
                data["experience"][0]["company"] = company
                data["experience"][0]["title"] = title
                data["experience"][0]["period"] = period
            else:
                data["experience"] = [{
                    "company": company,
                    "title": title,
                    "period": period,
                    "description": "",
                    "achievements": []
                }]
        # Achievements: bullets starting with \u2022, '•', or '▪'
        for m in re.finditer(r"[•▪]\s*([^•▪]+?)(?=\s*[•▪]|$)", exp_section):
            ach = m.group(1).strip()
            if ach:
                achievements.append(ach)
        # Also capture lines starting with hyphen-like markers
        for m in re.finditer(r"\n-\s*([^\n]+)", exp_section):
            achievements.append(m.group(1).strip())
        if achievements:
            if isinstance(data.get("experience"), list) and data["experience"]:
                data["experience"][0]["achievements"] = achievements

    # Education and Achievements section
    edu_section_match = re.search(r"education\s+and\s+achievements\s+(.*)$", norm, re.IGNORECASE)
    if edu_section_match:
        edu = edu_section_match.group(1)
        # Degree
        degree_match = re.search(r"Master[’'`s]*\s*degree\s*in\s*computer\s*science\s*-\s*(.*?)\,\s*(.*?)\.", edu, re.IGNORECASE)
        if degree_match:
            institution = degree_match.group(1).strip()
            location = degree_match.group(2).strip()
            data["education"] = [{
                "degree": "Master's degree in Computer Science",
                "institution": institution,
                "location": location
            }]
        # Awards: lines starting with '➢'
        awards = [m.group(1).strip() for m in re.finditer(r"\u27a2\s*([^\n]+)", edu)]  # \u27a2 is '➢'
        if awards:
            data["awards"] = awards
        # Certifications: lines starting with '❖'
        certs = [m.group(1).strip() for m in re.finditer(r"\u2756\s*([^\n]+)", edu)]  # \u2756 is '❖'
        if certs:
            data["certifications"] = certs

    return data


def load_text_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def save_json(path: str, obj: Dict[str, Any]):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main():
    parser = argparse.ArgumentParser(description="Synchronize resume-data.json from PDF or extracted text")
    parser.add_argument("--pdf", dest="pdf", help="Path to the PDF to parse", default=None)
    parser.add_argument("--text", dest="text", help="Path to extracted text file", default="latest_resume_text.txt")
    parser.add_argument("--json", dest="json_path", help="Path to resume-data.json to update", default="resume-data.json")
    args = parser.parse_args()

    # Load existing JSON
    if not os.path.exists(args.json_path):
        print(f"Error: JSON file not found: {args.json_path}")
        return
    with open(args.json_path, "r", encoding="utf-8") as jf:
        existing = json.load(jf)

    source_text = None
    if args.pdf and os.path.exists(args.pdf):
        source_text = extract_pdf_text(args.pdf)
    elif args.text and os.path.exists(args.text):
        source_text = load_text_file(args.text)
    else:
        print("Error: No valid source provided. Provide --pdf or --text path.")
        return

    updated = parse_resume_text_to_data(source_text, existing)
    save_json(args.json_path, updated)
    print(f"Updated {args.json_path} from {'PDF' if args.pdf and os.path.exists(args.pdf) else 'text'} source. Fields updated:")
    print(json.dumps({
        'personalInfo': updated.get('personalInfo', {}),
        'experience_head': updated.get('experience', [{}])[0].get('title', ''),
        'experience_period': updated.get('experience', [{}])[0].get('period', ''),
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()