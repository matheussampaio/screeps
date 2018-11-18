Screeps Code
=============================

## Requirements
- Docker


## Usage
1. `docker-compose run app bash`

## Build and Upload code
1. Copy `.env.example` to `.env`
1. Set your Screep's `email`, `token`, and code branch.
1. Run `docker-compose up run bash`
1. Run `cd packages/ai/`
1. Run `npm run build`
1. Run `npm run upload-code`


## License
MIT
