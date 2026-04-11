import time
import os

print("Starting live demo emulator...")

# Wait for subagent browser to login and load the page
time.sleep(20)

history_path = os.path.join(os.path.dirname(__file__), "history.txt")

with open(history_path, "a") as f:
    f.write("sad,0.92\n")
print("Appended sad sentiment.")

time.sleep(6)

with open(history_path, "a") as f:
    f.write("happy,0.99\n")
print("Appended happy sentiment.")

time.sleep(4)
print("Demo complete.")
