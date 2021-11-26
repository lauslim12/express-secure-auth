#!/bin/bash
# Main function.
main() {
  AUTH_API_URL="http://localhost:8080/api/v1/authentication"
  USER_API_URL="http://localhost:8080/api/v1/users"
  TOKEN=''

  # Simulate registration.
  echo "Simulating registration..."
  curl -H "Content-Type: application/json" -X POST -d '{"username":"sayu","password":"abcdEFGH12345","name":"Sayu Ogiwara","address":"Hokkaido, Japan"}' "$AUTH_API_URL/register" | json_pp; echo;
  curl -H "Content-Type: application/json" -X POST -d '{"username":"kaede","password":"abcdEFGH12345","name":"Kaede Kimura","address":"Setagaya, Tokyo"}' "$AUTH_API_URL/register" | json_pp; echo;
  echo

  # Simulate get recently created user.
  echo "Simulating getting recently created user..."
  curl -X GET "$USER_API_URL/sayu" | json_pp; echo;
  echo

  # Simulate login.
  echo "Simulating login..."
  TOKEN=$(curl -H "Content-Type: application/json" -X POST -d '{"username":"kaede","password":"abcdEFGH12345"}' "$AUTH_API_URL/login" | jq -r '.token'); echo
  echo

  # Simulate get all users.
  echo "Simulating getting all users..."
  curl -X GET $USER_API_URL | json_pp; echo;
  echo

  # Simulates get a single user.
  echo "Simulating getting a user..."
  curl -X GET "$USER_API_URL/kaede" | json_pp; echo;
  echo

  # Sleep for several seconds to prevent 'recently changed passwords' (computer is just too fast).
  sleep 2;

  # Simulates data adding without registration.
  echo "Simulating creating data without registration..."
  FUJIWARA_ID=$(curl -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -X POST -d '{"username":"fujiwara","password":"abcdEFGH12345","name":"Chika Fujiwara","address":"Kanazawa, Japan"}' $USER_API_URL | jq -r '.data.id')
  echo $FUJIWARA_ID

  # Simulates data updates.
  echo "Simulating data updates..."
  curl -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -X PUT -d '{"username":"mai","name":"Mai Sakurajima","address":"Fujisawa, Japan"}' "$USER_API_URL/$FUJIWARA_ID" | json_pp; echo;
  echo

  # Check previous update.
  echo "Simulating previously updated data..."
  curl -X GET "$USER_API_URL/mai" | json_pp; echo;
  echo

  # Simulates data deletion.
  echo "Simulating data deletion..."
  curl -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -X DELETE "$USER_API_URL/$FUJIWARA_ID"; echo;
  echo

  # Check previous deletion.
  echo "Simulating previously deleted data..."
  curl -X GET "$USER_API_URL/mai" | json_pp; echo;
  echo

  # Print out message.
  echo "Finished testing the API."
  echo "Integration tests have been run successfully."
}

# Run main script.
main