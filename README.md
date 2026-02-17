# Job Card Management System

A comprehensive web application for managing job cards, vehicles/machinery, and issued materials for maintenance operations. Built for **Edward and Christie** to streamline their vehicle and machinery maintenance workflow.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

---

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Ubuntu Server](#ubuntu-server)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [License](#license)

---

## ✨ Features

### 🚗 Vehicle/Machinery Management
- Add, edit, delete vehicles and machinery
- Import from CSV/Excel files
- Export to Excel
- Search and filter functionality

### 📦 Material Management
- **MRN Items** - Issued Materials tracking
- **Lubricants** - Oils, grease, hydraulic fluids
- **Common Items** - General/Special items
- **Filters** - Fuel, air, hydraulic filters
- Auto-categorization during import
- Import/Export functionality
- Status tracking (Pending/In Job Card)

### ⚡ Auto-Generate Job Cards
- **One-click bulk generation** - Create job cards for ALL pending materials instantly
- **Selective generation** - Choose specific vehicles
- **Auto-grouping** - Materials automatically grouped by vehicle/project
- Time-saving workflow - Seconds instead of hours!

### 📄 Job Card Management
- Create job cards manually or auto-generate
- Add job details (driver, supervisor, dates, costs)
- Track status: Draft → In Progress → Completed
- Cost calculation (spare parts, manpower, outside works)
- Print functionality

### 📊 Dashboard
- Statistics overview
- Pending materials alert
- Quick actions
- Recent job cards

---

## 🛠 Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | SQLite with Prisma ORM |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui |
| **Icons** | Lucide React |
| **Notifications** | Sonner |
| **Excel Processing** | xlsx |

---

## 💻 Requirements

### Minimum Requirements
- **Node.js**: v18.17 or higher
- **Package Manager**: Bun (recommended) or npm/yarn/pnpm
- **RAM**: 512MB minimum
- **Storage**: 100MB for application
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)

### Recommended
- **Node.js**: v20.x or higher
- **RAM**: 1GB or more
- **Browser**: Latest Chrome or Firefox

---

## 📥 Installation

### Windows

#### Step 1: Install Prerequisites

1. **Install Node.js** (v18+)
   ```powershell
   # Download from https://nodejs.org/ or use winget
   winget install OpenJS.NodeJS.LTS
   ```

2. **Install Bun** (recommended) or use npm
   ```powershell
   # Install Bun
   powershell -c "irm bun.sh/install.ps1 | iex"
   
   # Or npm comes with Node.js
   ```

3. **Install Git**
   ```powershell
   winget install Git.Git
   ```

#### Step 2: Clone and Setup

```powershell
# Clone the repository
git clone https://github.com/yohan114/Job-Card-Management-System.git
cd Job-Card-Management-System

# Install dependencies
bun install
# Or: npm install

# Setup database
bun run db:push
# Or: npm run db:push

# Start development server
bun run dev
# Or: npm run dev
```

#### Step 3: Access Application
Open browser and go to: `http://localhost:3000`

---

### macOS

#### Step 1: Install Prerequisites

1. **Install Homebrew** (if not installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**
   ```bash
   brew install node
   ```

3. **Install Bun** (recommended)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   source ~/.bashrc  # or ~/.zshrc
   ```

4. **Install Git**
   ```bash
   brew install git
   ```

#### Step 2: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yohan114/Job-Card-Management-System.git
cd Job-Card-Management-System

# Install dependencies
bun install
# Or: npm install

# Setup database
bun run db:push
# Or: npm run db:push

# Start development server
bun run dev
# Or: npm run dev
```

#### Step 3: Access Application
Open browser and go to: `http://localhost:3000`

---

### Ubuntu Server

#### Step 1: Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install Git
sudo apt install -y git

# Install build tools (for native modules)
sudo apt install -y build-essential python3
```

#### Step 2: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yohan114/Job-Card-Management-System.git
cd Job-Card-Management-System

# Install dependencies
bun install
# Or: npm install

# Setup database
bun run db:push
# Or: npm run db:push
```

#### Step 3: Production Setup (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Build the application
bun run build
# Or: npm run build

# Start with PM2
pm2 start npm --name "job-card-system" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Step 4: Configure Firewall (Optional)

```bash
# Allow port 3000
sudo ufw allow 3000

# Or use nginx as reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/job-card-system
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/job-card-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🚀 Usage

### Initial Setup

1. **Start the application**
   ```bash
   bun run dev
   ```

2. **Import Data**
   - Go to **Vehicles** tab → Click **Import** → Select your vehicle list (CSV/Excel)
   - Go to **MRN Items** tab → Click **Import** → Select your materials list (Excel)

3. **Generate Job Cards**
   - Click **Auto Generate** button in header
   - Review pending materials by vehicle
   - Click **Generate ALL Job Cards** or select specific vehicles

### File Format for Import

#### Vehicles/CSV Format:
| NO | E&C NO | BRAND | TYPE | MODEL NO | REGISTRATION NO | CAPACITY | YOM |
|----|--------|-------|------|----------|-----------------|----------|-----|
| 1 | LB-01 | JCB | Backhoe Loader | 3DX | ZA-2609 | 1.0 cu. m. | 2012 |

#### Materials/Excel Format:
| Date | MRN No. | Description | Unit | Qty | Vehicle / Project | Remark | Price | Total |
|------|---------|-------------|------|-----|-------------------|--------|-------|-------|
| 15/12/25 | 141401 | Fan belt | Nos | 2 | VR-71 | As per sample | | |

### Categories Auto-Detected:
- **MRN Items**: Default category
- **Lubricants**: Items containing "oil", "grease", "hydraulic fluid"
- **Common Items**: Items containing "bolt", "nut", "washer", "seal", "bearing"
- **Filters**: Items containing "filter"

---

## 📁 Project Structure

```
job-card-management-system/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Static files
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── machines/       # Machine CRUD APIs
│   │   │   ├── materials/      # Material CRUD APIs
│   │   │   └── job-cards/      # Job Card APIs
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main application
│   ├── components/ui/          # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   └── lib/
│       ├── db.ts               # Prisma client
│       └── utils.ts            # Utility functions
├── db/
│   └── custom.db               # SQLite database
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔌 API Endpoints

### Machines
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/machines` | List all machines |
| POST | `/api/machines/create` | Create new machine |
| GET | `/api/machines/[id]` | Get machine details |
| PUT | `/api/machines/[id]` | Update machine |
| DELETE | `/api/machines/[id]` | Delete machine |
| POST | `/api/machines/import` | Import from CSV/Excel |
| GET | `/api/machines/export` | Export to Excel |

### Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/materials` | List materials (filterable) |
| POST | `/api/materials/create` | Create new material |
| GET | `/api/materials/[id]` | Get material details |
| PUT | `/api/materials/[id]` | Update material |
| DELETE | `/api/materials/[id]` | Delete material |
| POST | `/api/materials/import` | Import from Excel |
| GET | `/api/materials/export` | Export to Excel |

### Job Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/job-cards` | List job cards |
| POST | `/api/job-cards` | Create job card |
| GET | `/api/job-cards/[id]` | Get job card details |
| PUT | `/api/job-cards/[id]` | Update job card |
| DELETE | `/api/job-cards/[id]` | Delete job card |
| GET | `/api/job-cards/auto-generate` | Auto-generate ALL |
| POST | `/api/job-cards/auto-generate` | Auto-generate selected |

---

## 🗄 Database Schema

### Machine
```prisma
- id: Int (Auto-increment)
- ecNo: String (E&C Code)
- brand: String
- type: String
- modelNo: String
- registrationNo: String (Unique)
- capacity: String
- yom: Int (Year of Manufacture)
```

### IssuedMaterial
```prisma
- id: Int
- date: DateTime
- mrnNo: String (MRN Number)
- description: String
- unit: String
- qty: Int
- vehicleProject: String
- remark: String
- price: Float
- total: Float
- category: Enum (MRN_ITEM, LUBRICANT, COMMON_ITEM, FILTER)
- isUsed: Boolean
```

### JobCard
```prisma
- id: Int
- jobCardNo: String (Unique - e.g., JC-2026-0001)
- vehicleRegNo: String
- companyCode: String
- vehicleMachineryMeter: Float
- repairType: String
- expectedCompletionDate: DateTime
- driverOperatorName: String
- driverOperatorContact: String
- bcdNo: String
- jobDescription: String
- jobStartDate: DateTime
- jobCompletedDate: DateTime
- supervisorName: String
- totalSparePartsCost: Float
- totalManpowerCost: Float
- outsideWorkCost: Float
- status: Enum (DRAFT, IN_PROGRESS, COMPLETED, CANCELLED)
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./db/custom.db"
```

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/dashboard.png)

### Auto Generate
![Auto Generate](docs/auto-generate.png)

### Job Card List
![Job Cards](docs/job-cards.png)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Yohan**
- GitHub: [@yohan114](https://github.com/yohan114)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Document No.:** EC40.WS.FO.3:4:22.10
**Company:** Edward and Christie
