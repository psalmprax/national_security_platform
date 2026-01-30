import re
import sys

def audit_tags(filename):
    print(f"Auditing {filename}...")
    with open(filename, "r") as f:
        content = f.read()

    # 1. Strip comments (block and line)
    # Note: This is a simple stripper and might be imperfect for nested structures but good for general auditing
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    content = re.sub(r"\{/\*.*?\*/\}", "", content, flags=re.DOTALL)
    
    # 2. Find tags - expanded list
    # We care about structural tags that might be unbalanced
    tags_of_interest = "div|span|header|footer|main|aside|nav|section|article|button|ul|ol|li|motion\\.div"
    
    # Regex to capture <Tag ...>, </Tag>, or <Tag ... />
    # Group 1: Opening tag name
    # Group 2: Closing tag name
    matches = list(re.finditer(f"<(?:({tags_of_interest})\\b[^>]*|/({tags_of_interest}))>", content))
    
    stack = []
    errors = []
    
    # helper to find line number from character position
    def get_line_no(pos):
        return content.count("\n", 0, pos) + 1

    for m in matches:
        tag_text = m.group(0)
        pos = m.start()
        line_no = get_line_no(pos)
        
        # Check if it's a self-closing tag
        if tag_text.endswith("/>"):
            continue

        if m.group(2): # Closing tag, e.g. </div>
            tag_name = m.group(2)
            if not stack:
                errors.append(f"L{line_no}: Unexpected closing tag </{tag_name}>")
            else:
                top_name, top_line = stack.pop()
                if top_name != tag_name:
                    errors.append(f"L{line_no}: Mismatched tag: </{tag_name}> closes <{top_name}> from L{top_line}")
        elif m.group(1): # Opening tag, e.g. <div>
            tag_name = m.group(1)
            stack.append((tag_name, line_no))
                
    if stack:
        for tag_name, line in stack:
            print(f"Unclosed <{tag_name}> from line {line}")
    
    if errors:
        for err in errors:
            print(err)
            
    if not stack and not errors:
        print("BALANCED")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        audit_tags(arg)
