# SateLabs

Cyber Security Learning Platform

## Overview

SateLabs is a FastAPI-based web application designed to provide a platform for learning and practicing cybersecurity concepts.

## Features

- 🚀 Built with FastAPI
- 📚 Interactive learning modules
- 🔒 Security-focused curriculum

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/satelabs.git
cd satelabs
```

2. Create a virtual environment:
```bash
python -m venv .venv
```

3. Activate the virtual environment:
- **Windows:**
  ```bash
  .venv\Scripts\activate
  ```
- **macOS/Linux:**
  ```bash
  source .venv/bin/activate
  ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Project Structure

```
satelabs/
├── app/
│   └── main.py          # Main application entry point
├── requirements.txt     # Python dependencies
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## License

This project is licensed under the MIT License.

## Contact

For more information, visit SateLabs.
