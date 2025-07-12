import re

# Read the file
with open('seedDatabase.js', 'r', encoding='utf-8') as file:
    content = file.read()

# Property titles and their corresponding slugs
property_slugs = [
    ("Tropical Beach Villa Bali", "tropical-beach-villa-bali"),
    ("Beachside Cottage Lombok", "beachside-cottage-lombok"),
    ("Highland Retreat Bandung", "highland-retreat-bandung"),
    ("Pine Forest Cabin Bogor", "pine-forest-cabin-bogor"),
    ("Modern Loft Jakarta", "modern-loft-jakarta"),
    ("Executive Suite Surabaya", "executive-suite-surabaya"),
    ("Luxury Villa Ubud", "luxury-villa-ubud"),
    ("Modern Villa Canggu", "modern-villa-canggu"),
    ("Ocean View Resort Bintan", "ocean-view-resort-bintan"),
    ("Alpine Cabin Dieng", "alpine-cabin-dieng"),
    ("Premium Suite Medan", "premium-suite-medan"),
    ("Traditional Villa Yogyakarta", "traditional-villa-yogyakarta"),
    ("Surfing Lodge Mentawai", "surfing-lodge-mentawai"),
    ("Highland Resort Toba", "highland-resort-toba")
]

# Add slug after each title
for title, slug in property_slugs:
    pattern = f'(title: "{title}",)\n'
    replacement = f'\\1\n      slug: "{slug}",\n'
    content = re.sub(pattern, replacement, content)

# Write back to file
with open('seedDatabase.js', 'w', encoding='utf-8') as file:
    file.write(content)

print("Added slugs to all properties!")
