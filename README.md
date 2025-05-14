# Nano Scale Device Lab Inventory Portal

> 🚫 **IF THERE ARE MULTIPLE PEOPLE WORKING ON THE REPO, DO NOT COMMIT DIRECTLY TO MAIN. MAKE A NEW BRANCH AND OPEN A PULL REQUEST FOR OTHERS TO REVIEW.**

## Contents:

- [Steps to get the software running on your machine](#steps-to-get-the-software-running-on-your-machine) *( needs updation)*
- [Oracle Compute Configuration](#oracle-compute-configuration)

## Steps to get the software running on your machine:
> ⚠️ This section is outdated. It will be updated once CI/CD is setup, isolating development from production.

- ### Install Docker
    - Mac/Windows : Install Docker Desktop
    - Linux : Install Docker and Docker-Compose separately

- ### Keep Docker Running
    - Mac/Windows : Run Docker Desktop and Add it to Startup Apps
    - Linux :

        ```bash
        sudo systemctl start docker && sudo systemctl enable docker
        ```

        <!-- Has to be modified, not verified if its right -->

- ### Set up the Environment variables
    - Make a .env file in the backend and frontend
    - #### Frontend:
        - Add this to the env file
            ```env
            VITE_BACKEND_URL=http://localhost:3000/api
            ```
    - #### Backend:
        - Add these to the env file
            ```env
            FRONTEND_URL= http://localhost:5173 
            DB_URI=mongodb://mongo:27017/<database_name>
            JWT_SECRET_KEY=<some_random_string>
            PORT=3000
            ```
    - **Note: this is only for development. Add the appropriate URL in the production environment.**

- ### Run the project
    - Ensure docker is running
    - In the root directory run this command:
        ```bash
        docker-compose up
        ```
    - If you have installed this code before and want to update it with a newer version, run this command
        ```bash
        docker-compose up --build
        ```

## Oracle Compute Configuration

- The production server is hosted on `Oracle Cloud Infrastructure Compute Instance`

> ⚠️ For the account credentials and SSH keys, contact the project administrator.

>🚫 **THIS IS A PRODUCTION SERVER!!! DONOT MODIFY ANY FILES ONCE LOGGED IN. ALWAYS CONSULT THE TEAM BEFORE TAKING ANY IRREVERSIBLE DECISION ON THE SERVER**

- The SSL Certification and HTTP->HTTPS forwarding is taken care by caddy (Check `docker-compose.yml` and `Caddyfile` for more information)

- Caddy is setup to reverse proxy `/` to frontend ( `PORT 3000` ) and `/api` to backend ( `PORT 4000` )


