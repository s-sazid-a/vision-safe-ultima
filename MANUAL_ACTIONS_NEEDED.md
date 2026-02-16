# 🛑 YOUR TO-DO LIST (REQUIRED)

Hello! I have done all the coding, but I need you to create the accounts and get the "keys" that make the app work. Please follow these steps exactly. I have made them as simple as possible.

---

## 1️⃣ STEP 1: Put Code on GitHub (The Cloud)

1.  **Open this link:** [https://github.com/new](https://github.com/new) (Sign in if needed).
2.  **Repository name:** Type exactly: `vision-safe-ultima`
3.  **Description:** You can leave this empty.
4.  **Public/Private:** Choose "Public".
5.  **Initialize this repository with:** **DO NOT** check any boxes here (No Readme, No .gitignore).
6.  **Click:** "Create repository".
7.  **Copy the URL:** On the next page, look for a link that ends in `.git` (like `https://github.com/YOUR_NAME/vision-safe-ultima.git`). Copy it.
8.  **Tell Me:** Paste that URL in our chat so I can push the code for you.

---

## 2️⃣ STEP 2: Get a Database (Turso)

1.  **Go here:** [https://turso.tech](https://turso.tech) and click "Sign Up" (Use GitHub if possible).
2.  **Install the Tool:**
    *   Open your computer's **Terminal** or **Command Prompt** (Search for "cmd" in Windows).
    *   Paste this and hit Enter: `curl -sSfL https://get.tur.so/install.sh | bash`
    *   *If that looks scary or doesn't work, just tell me "I can't install Turso CLI" and we will find another way.*
3.  **Login:** In the terminal, type: `turso auth login`. It will open your browser to confirm.
4.  **Create DB:** Type: `turso db create vision-safe-ultima-db`
5.  **Get URL:** Type: `turso db show vision-safe-ultima-db`. Copy the URL (starts with `libsql://`).
6.  **Get Token:** Type: `turso db tokens create vision-safe-ultima-db`. Copy the long text (Token).
7.  **Save them:**
    *   Open the file `vision_safe_ultima_backend_v2.0\.env` in Notepad.
    *   Paste the URL after `TURSO_DATABASE_URL=`.
    *   Paste the Token after `TURSO_AUTH_TOKEN=`.
    *   Save the file.

---

## 3️⃣ STEP 3: Get Authentication (Clerk)

1.  **Go here:** [https://dashboard.clerk.com/sign-up](https://dashboard.clerk.com/sign-up)
2.  **Create App:**
    *   **Name:** `Vision Safe Ultima`
    *   **"How will your users sign in?":** Check **Email** and **Google**.
    *   Click **Create Application**.
3.  **Get API Keys:**
    *   You will see "API Keys" on the screen.
    *   Copy **Publishable Key** (starts with `pk_test_`).
    *   Copy **Secret Key** (starts with `sk_test_`).
4.  **Save them:**
    *   **Frontend:** Open `vision_safe_ultima_webapp_v2.0\.env` in Notepad. Paste `pk_test_...` after `VITE_CLERK_PUBLISHABLE_KEY=`.
    *   **Backend:** Open `vision_safe_ultima_backend_v2.0\.env` in Notepad. Paste `sk_test_...` after `CLERK_SECRET_KEY=`.
5.  **Save both files.**

---

## 🏁 FINAL CHECK

Once you have done these 3 steps, type this in the chat:
**"I have updated the env files."**

---

## 4️⃣ STEP 4: Get File Storage (Backblaze B2)

1.  **Go here:** [https://www.backblaze.com/b2/sign-up.html](https://www.backblaze.com/b2/sign-up.html) (Sign Up for B2 Cloud Storage).
2.  **Create Bucket:**
    *   Click **Buckets** in the menu.
    *   Click **Create a Bucket**.
    *   Name it: `vision-safe-storage-UNIQUE_NAME` (must be globally unique).
    *   **Privacy:** SELECT **Private** (Important for security).
    *   Click **Create a Bucket**.
3.  **Get Keys:**
    *   Click **App Keys** in the menu.
    *   Click **Add a New Application Key**.
    *   Name: `VisionSafeKey`
    *   **Allow access to Bucket(s):** Select your new bucket.
    *   **Type of Access:** Read and Write.
    *   Click **Create New Key**.
    *   **COPY THESE (They only show once!):**
        *   `keyID` (Application Key ID)
        *   `applicationKey` (Application Key)
4.  **Save them:**
    *   Open `vision_safe_ultima_backend_v2.0\.env`.
    *   Add these lines at the bottom (replace `your_...` with real values):
        ```
        B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
        B2_KEY_ID=your_key_id
        B2_APPLICATION_KEY=your_application_key
        B2_BUCKET_NAME=your_bucket_name
        ```
    *   *Note: Endpoint depends on your region, check "S3 Endpoint" in Bucket Settings.*
    *   Save the file.

---

## 5️⃣ STEP 5: Get Backup Storage (ImgBB) (Optional but Recommended)

1.  **Go here:** [https://imgbb.com/login](https://imgbb.com/login)
2.  **Get API Key:**
    *   Go to [https://api.imgbb.com/](https://api.imgbb.com/)
    *   Click **Get API Key**.
    *   Copy the key.
3.  **Save it:**
    *   Open `vision_safe_ultima_backend_v2.0\.env`.
    *   Add:
        ```
        IMGBB_API_KEY=your_api_key
        ```
    *   Save the file.

---

## 7️⃣ STEP 7: Host Backend (Railway)

1.  **Go here:** [https://railway.app](https://railway.app) (Login with GitHub).
2.  **New Project:**
    *   Click **New Project** -> **Deploy from GitHub repo**.
    *   Select `vision-safe-ultima`.
3.  **Configure:**
    *   Click on the project card.
    *   Go to **Settings** -> **Root Directory**.
    *   Set it to: `/vision_safe_ultima_backend_v2.0` **(Very Important!)**
4.  **Environment Variables:**
    *   Go to **Variables** tab.
    *   Click **Raw Editor** (top right of variables section).
    *   Open `vision_safe_ultima_backend_v2.0\.env` on your PC.
    *   Copy EVERYTHING inside it.
    *   Paste it into Railway.
    *   **ADD ONE MORE:**
        *   Key: `FRONTEND_URL`
        *   Value: `https://vision-safe-ultima.vercel.app` (Or whatever your Vercel URL is).
    *   Click **Update Variables**.
5.  **Deploy:**
    *   It should redeploy automatically. If not, click **Deploy**.
    *   Wait for "Active".
6.  **Get URL:**
    *   Go to **Settings** -> **Networking** -> **Public Networking**.
    *   Click **Generate Domain**.
    *   Copy the URL (e.g., `https://vision-safe-ultima-production.up.railway.app`).
7.  **Final Polish:**
    *   Go back to **Vercel** -> Settings -> Environment Variables.
    *   Add/Edit `VITE_API_URL` with your **Railway** URL.
    *   Redeploy Vercel.

**🎉 YOU ARE DONE!** Paste the Railway URL here.
