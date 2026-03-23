import requests

calendar_id = "compagniebarbershopquartet@gmail.com"
safe_id = calendar_id.replace('@', '%40')
ical_url = f"https://calendar.google.com/calendar/ical/{safe_id}/public/basic.ics"

print(f"Fetching: {ical_url}")
resp = requests.get(ical_url)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    lines = resp.text.splitlines()
    for i, line in enumerate(lines[:100]):
        if "SUMMARY" in line or "DUNKERQUE" in line:
            print(f"Line {i}: {line}")
else:
    print("Failed to fetch.")
