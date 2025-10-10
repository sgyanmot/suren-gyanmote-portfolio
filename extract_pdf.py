import argparse
import json
import os
import re
from typing import List, Dict, Any

# Optional PDF extraction dependency
try:
    import pypdf  # type: ignore
except Exception:
    pypdf = None  # type: ignore


def extract_pdf_text(pdf_path: str) -> str:
    if pypdf is None:
        return ""
    try:
        reader = pypdf.PdfReader(  # type: ignore[attr-defined]
            pdf_path
        )
        parts: List[str] = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        return "\n".join(parts)
    except Exception:
        return ""


def normalize_text(text: str) -> str:
    # Preserve newlines for section parsing; collapse excessive spaces
    t = re.sub(r"[\t\r]", " ", text)
    # Normalize bullet symbols
    t = re.sub(r"\u2022|▪", "•", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def parse_emails(s: str) -> List[str]:
    pattern = (
        r"[A-Za-z0-9._%+-]+@"
        r"[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
    )
    emails = re.findall(pattern, s)
    seen: set[str] = set()
    out: List[str] = []
    for e in emails:
        if e not in seen:
            seen.add(e)
            out.append(e)
    return out


def parse_resume_text_to_data(
    text: str,
    existing: Dict[str, Any],
) -> Dict[str, Any]:
    data = dict(existing)
    raw = text or ""
    norm = normalize_text(raw)

    # Personal info updates (email only; keep phone/name as-is)
    emails = parse_emails(norm)
    if emails:
        pi = data.get("personalInfo", {})
        pi["email"] = emails[0]
        data["personalInfo"] = pi

    # Enhanced skills categorization
    existing_skills = data.get("skills", {})
    skill_sets: Dict[str, set] = {
        "cloud": set(existing_skills.get("cloud", [])),
        "ai_genai": set(existing_skills.get("ai_genai", [])),
        "security": set(existing_skills.get("security", [])),
        "systems": set(existing_skills.get("systems", [])),
        "programming": set(existing_skills.get("programming", [])),
        "infrastructure": set(existing_skills.get("infrastructure", [])),
        "specialties": set(existing_skills.get("specialties", [])),
    }

    def add_if(pattern: str, label: str, category: str):
        if re.search(pattern, norm, re.IGNORECASE):
            skill_sets[category].add(label)

    # Cloud
    add_if(r"\boci\b", "Oracle Cloud Infrastructure (OCI)", "cloud")
    add_if(r"oracle\s+cloud", "Oracle Cloud", "cloud")
    add_if(r"\bdbaas\b", "DBAAS", "cloud")
    add_if(r"\bexacs\b", "EXACS", "cloud")
    add_if(r"object\s+storage", "Object Storage", "cloud")
    add_if(r"block\s+storage", "Block Storage", "cloud")
    add_if(r"\baws\b", "AWS", "cloud")
    add_if(r"azure", "Microsoft Azure", "cloud")
    add_if(r"\bdr\b|fsdr", "OCI DR/FSDR", "cloud")

    # AI / GenAI
    add_if(r"generative\s+ai", "Generative AI", "ai_genai")
    add_if(r"agentic", "AI Agentic Solutions", "ai_genai")
    add_if(r"multi-?llm|\bllm\b", "Multi-LLM Models", "ai_genai")
    add_if(r"ai\s+infrastructure", "AI Infrastructure", "ai_genai")
    add_if(r"github\s+(integration|ai)", "GitHub AI Integrations", "ai_genai")

    # Security
    add_if(r"hippa|hipaa", "HIPAA", "security")
    add_if(r"gdpr", "GDPR", "security")
    add_if(
        r"secure\s+sdlc|secured\s+coding",
        "Secured Coding",
        "security",
    )
    add_if(r"devsecops", "DevSecOps", "security")
    add_if(r"owasp", "OWASP", "security")
    add_if(r"sans", "SANS", "security")
    add_if(r"security\s+architecture", "Security Architecture", "security")
    add_if(r"risk\s+compliance", "Risk Compliance", "security")

    # Systems
    add_if(r"linux", "Linux", "systems")
    add_if(r"solaris", "Solaris", "systems")
    add_if(r"unix", "Unix", "systems")
    add_if(r"windows", "Windows", "systems")
    add_if(r"\bmac\b", "Mac", "systems")
    add_if(r"exalogic", "Exalogic", "systems")

    # Programming
    add_if(
        r"shell\s+script|shell\s+scripting",
        "Shell Scripting",
        "programming",
    )
    add_if(r"python", "Python", "programming")
    add_if(r"perl", "Perl", "programming")
    add_if(r"pro\s*\*?c", "Pro*C", "programming")
    add_if(r"oracle\s+forms", "Oracle Forms", "programming")

    # Infrastructure
    add_if(r"terraform", "Terraform", "infrastructure")
    add_if(r"ansible", "Ansible", "infrastructure")
    add_if(
        r"infrastructure\s+automation",
        "Infrastructure Automation",
        "infrastructure",
    )
    add_if(
        r"network\s+architecture",
        "Network Architecture",
        "infrastructure",
    )
    add_if(r"\bvcn\b", "VCN", "infrastructure")
    add_if(r"\bvpn\b", "VPN", "infrastructure")
    add_if(r"firewall", "Firewall", "infrastructure")

    # Specialties
    add_if(
        r"performance\s+tuning|performance\b",
        "Performance Tuning",
        "specialties",
    )
    add_if(
        r"capacity\s+planning|capacity\b",
        "Capacity Planning",
        "specialties",
    )
    add_if(r"migration", "Database Migration", "specialties")
    add_if(r"disaster\s+recovery", "Disaster Recovery", "specialties")
    add_if(r"system\s+administration", "System Administration", "specialties")
    add_if(
        r"technical\s+project\s+manager|project\s+management",
        "Technical Project Management",
        "specialties",
    )

    data["skills"] = {
        "cloud": sorted(skill_sets["cloud"]),
        "ai_genai": sorted(skill_sets["ai_genai"]),
        "security": sorted(skill_sets["security"]),
        "systems": sorted(skill_sets["systems"]),
        "programming": sorted(skill_sets["programming"]),
        "infrastructure": sorted(skill_sets["infrastructure"]),
        "specialties": sorted(skill_sets["specialties"]),
    }

    # Professional Summary parsing
    summary_text = ""
    m_summary = re.search(
        r"(professional\s+summary|summary|profile)\b",
        norm,
        re.IGNORECASE,
    )
    if m_summary:
        tail = norm[m_summary.end():]
        m_next = re.search(
            r"\b("
            r"experience|projects|skills|education|"
            r"certifications|awards|stats|contact|"
            r"work\s+experience"
            r")\b",
            tail,
            re.IGNORECASE,
        )
        if m_next:
            summary_text = tail[:m_next.start()]
        else:
            summary_text = tail[:600]
        summary_text = summary_text.strip(" -•")
        summary_text = re.sub(r"\s+", " ", summary_text).strip()
        if summary_text:
            data["professionalSummary"] = summary_text
            pi = data.get("personalInfo", {})
            short_summary = summary_text
            if len(short_summary) > 300:
                short_summary = (
                    short_summary[:300].rsplit(" ", 1)[0] + "..."
                )
            pi["summary"] = short_summary
            data["personalInfo"] = pi

    # Education parsing
    edu_text = ""
    m = re.search(
        r'education[^"]{0,200}',
        norm,
        re.IGNORECASE,
    )
    if m:
        start = m.start()
        edu_text = norm[start:start + 800]
    items: List[Dict[str, Any]] = []
    # Simple degree capture
    for mm in re.finditer(
        r"(masters|bachelor|mca|b\.tech|m\.tech)[^,\n]*",
        edu_text,
        re.IGNORECASE,
    ):
        deg = mm.group(0).strip()
        items.append({"degree": deg})
    # Awards and distinctions
    if re.search(
        r"distinction|first\s+class|gold\s+medal",
        edu_text,
        re.IGNORECASE,
    ):
        items.append({"degree": "Awards/Distinctions", "notes": edu_text})
    if items:
        data["education"] = items

    # Certifications section
    certs: List[str] = data.get("certifications", [])
    for mm in re.finditer(
        r"oracle\s+cloud\s+certification[^\n]*",
        norm,
        re.IGNORECASE,
    ):
        c = mm.group(0).strip()
        if c not in certs:
            certs.append(c)
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
    parser = argparse.ArgumentParser(
        description=(
            "Synchronize resume-data.json from PDF or extracted text"
        ),
    )
    parser.add_argument(
        "--pdf",
        dest="pdf",
        default=None,
        help="Path to the PDF to parse",
    )
    parser.add_argument(
        "--text",
        dest="text",
        default="latest_resume_text.txt",
        help="Path to extracted text file",
    )
    parser.add_argument(
        "--json",
        dest="json_path",
        default="resume-data.json",
        help="Path to resume-data.json to update",
    )
    args = parser.parse_args()

    if not os.path.exists(args.json_path):
        print(f"Error: JSON file not found: {args.json_path}")
        return
    with open(args.json_path, "r", encoding="utf-8") as jf:
        existing = json.load(jf)

    source_text = None
    if args.pdf and os.path.exists(args.pdf):
        source_text = extract_pdf_text(args.pdf)
        if source_text:
            with open(args.text, "w", encoding="utf-8") as tf:
                tf.write(source_text)
    elif args.text and os.path.exists(args.text):
        source_text = load_text_file(args.text)
    else:
        print("Error: No valid source provided. Provide --pdf or --text path.")
        return

    updated = parse_resume_text_to_data(source_text, existing)
    save_json(args.json_path, updated)

    print("Updated fields:")
    print(
        "- personalInfo.email:",
        updated.get("personalInfo", {}).get("email"),
    )
    print(
        "- skills categories:",
        list(updated.get("skills", {}).keys()),
    )
    print(
        "- education count:",
        len(updated.get("education", [])),
    )
    print(
        "- certifications count:",
        len(updated.get("certifications", [])),
    )


if __name__ == "__main__":
    main()