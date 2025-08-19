# Fullstack Docker Compose Application

This is a fullstack application with a FastAPI backend and React frontend using Material-UI, all containerized with Docker Compose.

## Prerequisites

- Docker (version 20.10.0 or higher)
- Docker Compose (version 1.29.0 or higher)
- Node.js (for local development, optional)
- Python 3.9+ (for local development, optional)

## Project Structure

```
.
├── backend/               # FastAPI backend
│   ├── main.py           # Main FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Backend Docker configuration
├── frontend/             # React frontend
│   ├── public/           # Static files
│   ├── src/              # React source code
│   ├── package.json      # Node.js dependencies
│   └── Dockerfile        # Frontend Docker configuration
└── docker-compose.yml    # Docker Compose configuration
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Backend API Docs: http://localhost:8000/docs

## Development

### Backend Development

To run the backend locally without Docker:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development

To run the frontend locally without Docker:

```bash
cd frontend
npm install
npm start
```

## Available Scripts

- `docker-compose up --build` - Build and start all services
- `docker-compose down` - Stop and remove all containers
- `docker-compose logs -f` - View logs from all services

## Environment Variables

### Backend
- `ENV` - Environment (development/production)

### Frontend
- `REACT_APP_API_URL` - URL of the backend API

## License

This project is licensed under the MIT License.
