import re

# Read the file
with open('seedDatabase.js', 'r', encoding='utf-8') as file:
    content = file.read()

# Replace all area: number patterns except those already fixed
pattern = r'(\s+)area: (\d+)(\s*)'
replacement = r'\1area: {\n\1  size: \2,\n\1  unit: "sqm"\n\1}\3'

content = re.sub(pattern, replacement, content)

# Write back to file
with open('seedDatabase.js', 'w', encoding='utf-8') as file:
    file.write(content)

print("Fixed all area fields!")
