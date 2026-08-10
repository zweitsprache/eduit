import json
import sys

import fitz


TARGET_TEXT = "Marcel Allenspach"
EXPECTED_MATCHES_PER_PAGE = {
    "a4-portrait": 1,
    "a4-landscape": 1,
    "a5-landscape": 2,
}


def main():
    if len(sys.argv) != 4:
        raise RuntimeError("Usage: redact-pdf-text.py <input> <output> <document-size>")

    input_path, output_path, document_size = sys.argv[1:]
    expected_per_page = EXPECTED_MATCHES_PER_PAGE[document_size]
    document = fitz.open(input_path)
    matches = []

    for page_index, page in enumerate(document):
        page_matches = page.search_for(TARGET_TEXT)
        if not page_matches:
            continue
        if len(page_matches) != expected_per_page:
            raise RuntimeError(
                f"Page {page_index + 1}: expected {expected_per_page} footer "
                f"match(es), found {len(page_matches)}."
            )

        for rectangle in page_matches:
            if rectangle.x0 > page.rect.width / 2 or rectangle.y0 < page.rect.height * 0.42:
                raise RuntimeError(
                    f"Page {page_index + 1}: target text is outside an expected "
                    "left footer position."
                )
            padded = fitz.Rect(
                max(0, rectangle.x0 - 1),
                max(0, rectangle.y0 - 1),
                min(page.rect.width, rectangle.x1 + 1),
                min(page.rect.height, rectangle.y1 + 1),
            )
            page.add_redact_annot(padded, fill=(1, 1, 1), cross_out=False)
            matches.append({
                "page": page_index + 1,
                "text": TARGET_TEXT,
                "x": padded.x0,
                "y": page.rect.height - padded.y1,
                "width": padded.width,
                "height": padded.height,
            })

        page.apply_redactions(images=0, graphics=0, text=0)

    document.save(output_path, garbage=4, deflate=True, clean=True)
    print(json.dumps({"pageCount": document.page_count, "matches": matches}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)