# MUT API (unofficial api)

A small API for MUT student portal(https://portal.mut.ac.ke).

The portal is messy ..ASP.NET session cookies, anti-forgery tokens, HTML we have to scrape, a login page that redirects in circles. This service handles all of it and hands back plain JSON.

Runs on Cloudflare Workers via [vinext](https://vinext.dev).

This is an active project. It is not finished, and it will keep changing. so things will break and get fixed as we go.

## Running it

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

optional:

```bash
npm run typecheck
npm run lint
npm run build
npm run deploy
```

## Endpoints


| Route                                         | function                                  |
| --------------------------------------------- | ----------------------------------------- |
| `POST /api/auth/login`                        | Logs into the portal, returns a JWT       |
| `GET /api/features`                           | Which screens are switched on             |
| `GET /api/dashboard`                          | Name, reg number, programme, fees summary |
| `GET /api/academic/years`                     | Years you can pick for a transcript       |
| `GET /api/academic/transcript?year=2025/2026` | Transcript PDF, base64                    |
| `GET /api/academic/units`                     | Unit registration                         |
| `GET /api/academic/semester-registration`     | Semester reporting                        |
| `GET /api/profile/details`                    | Email and phone                           |
| `GET /api/profile/photo`                      | Profile photo                             |
| `GET /api/hostel/spaces`                      | Hostels and free rooms                    |
| `GET /api/hostel/costs?hostelId=1`            | Room prices                               |
| `GET /api/fees/balance`                       | Current balance                           |
| `GET /api/fees/statement`                     | Fee statement PDF                         |

Everything except login needs `Authorization: Bearer <jwt>`.

## No warranty

This is unofficial and not connected to Murang'a University of Technology in any way.

- **No warranty.** It comes as-is. No promises it works, that it will keep working, or that what it returns is correct. It reads the same pages a student would see, and it can be wrong or out of date.
- **Use at your own risk.** You accept that things may break, return the wrong thing, or stop working entirely.
- **We don't modify anything.** Every call is a read. No grades, no registrations, no payments, no changes to any record. If that ever changes, it will be opt-in and off by default.
- **We don't store your data.** Your password is never saved  i
- **No legal action.** By using this you accept it as a personal, unofficial tool and agree not to hold the author liable for anything that comes of using it. If that is not acceptable to you, don't use it.

If you would rather not use this, the portal works fine on its own.
