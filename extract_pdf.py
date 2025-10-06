#!/usr/bin/env python3

from pypdf import PdfReader


def extract_pdf_text(pdf_path):
    """
    Extract text from a PDF file using pypdf
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        str: Extracted text from the PDF
    """
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"


if __name__ == "__main__":
    pdf_file = ("SurenderGyanmote-Database_System_CloudArchitect-"
                "1page-Akamai.pdf")
    extracted_text = extract_pdf_text(pdf_file)
    print(extracted_text)