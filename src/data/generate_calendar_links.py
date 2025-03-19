import json
from datetime import datetime

# Load data from speakers.json
with open("speakers.json") as file:
    speakers = json.load(file)

# Helper function to format date and time for calendar links
def format_datetime(date, time):
    dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    return dt.strftime("%Y%m%dT%H%M%SZ")

# Generate Google Calendar links and .ics content
individual_ics = []
series_ics = ["BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VT Seva Career Compass//EN"]

for speaker in speakers:
    name = speaker["name"]
    title = f"VT Seva Career Compass: {name}"
    date = speaker["session"]["date"]
    time = speaker["session"]["time"]
    link = speaker["session"]["link"]
    details = speaker["name"] + " is a " + speaker["role"] + " at " + speaker["organization"] + ". " + speaker["blurb"]
    
    start_time = format_datetime(date, time)
    end_time = format_datetime(date, str(int(time.split(':')[0]) + 1) + ":00")

    # Google Calendar Link
    calendar_link = (
        f"https://calendar.google.com/calendar/render?action=TEMPLATE"
        f"&text={title.replace(' ', '+')}"
        f"&dates={start_time}/{end_time}"
        f"&details={details.replace(' ', '+')}"
        f"&location={link.replace(' ', '+')}"
    )
    speaker["session"]["addToCalendar"] = calendar_link

    # Individual .ics file
    ics_event = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VT Seva Career Compass//EN
BEGIN:VEVENT
SUMMARY:{title}
DTSTART:{start_time}
DTEND:{end_time}
DESCRIPTION:{details}
LOCATION:{link}
END:VEVENT
END:VCALENDAR
"""
    with open(f"{name.replace(' ', '_').lower()}.ics", "w") as ics_file:
        ics_file.write(ics_event)
    
    individual_ics.append(ics_event)
    series_ics.append(ics_event.strip().replace("END:VCALENDAR", "").strip())

# Generate Series .ics File
series_ics.append("END:VCALENDAR")
with open("career_compass_series.ics", "w") as series_file:
    series_file.write("\n".join(series_ics))

# Save the updated JSON with calendar links
with open("speakers_with_calendar.json", "w") as updated_file:
    json.dump(speakers, updated_file, indent=4)

print("✅ Google Calendar links added to JSON.")
print("✅ Individual .ics files created.")
print("✅ Master .ics file created for the full series.")
