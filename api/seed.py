"""
Ezyride — demo seed data
=========================
Provisions everything a fresh environment needs to demo the full ride lifecycle:
a demo rider, an available demo chauffeur (so matching always succeeds on stage),
the five EV fleet tiers, supported airports, and a mocked flight.

Design goals for the MVP:
- Deterministic: the same IDs and demo login every run (idempotent upsert).
- Self-contained: no external flight/payment providers.
- Framework-light: this is plain data + helpers you can wire into FastAPI/SQLAlchemy,
  Supabase, or an in-memory store. `main()` prints the dataset as JSON so it is
  useful even before the DB layer exists.

Money is in integer minor units (cents). Currency: USD for the demo.

Usage:
    python api/seed.py            # print the seed dataset as JSON
    python api/seed.py --emit env # print demo credentials for the frontend .env
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone


# --------------------------------------------------------------------------- #
# Stable demo identifiers — keep these constant so previews are reproducible.
# --------------------------------------------------------------------------- #
DEMO_RIDER_ID = "11111111-1111-1111-1111-111111111111"
DEMO_CHAUFFEUR_ID = "22222222-2222-2222-2222-222222222222"

DEMO_RIDER_EMAIL = "traveler@ezyride.demo"
DEMO_CHAUFFEUR_EMAIL = "chauffeur@ezyride.demo"
DEMO_PASSWORD = "FrictionlessLuxury1"  # demo only — never ship a real default


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


# --------------------------------------------------------------------------- #
# Fleet tiers — mirror the five tiers in index.html / the PRD.
# baseFare + perKm drive the deterministic quote in fare_estimate().
# --------------------------------------------------------------------------- #
FLEET_TIERS = [
    {
        "id": "economy", "name": "Economy",
        "description": "Smart, quiet city EVs for solo travellers and light luggage.",
        "maxPassengers": 3, "luggage": "2 cabin bags",
        "exampleVehicles": ["Renault 5 E-Tech", "MG4"],
        "baseFare": {"amount": 2900, "currency": "USD"},
        "perKm": {"amount": 130, "currency": "USD"},
    },
    {
        "id": "standard", "name": "Standard",
        "description": "Spacious long-range sedans. Our most popular class.",
        "maxPassengers": 4, "luggage": "2 large + 2 cabin",
        "exampleVehicles": ["Tesla Model 3", "BYD Seal"],
        "baseFare": {"amount": 3900, "currency": "USD"},
        "perKm": {"amount": 160, "currency": "USD"},
    },
    {
        "id": "executive", "name": "Executive",
        "description": "Business-class comfort with corporate-trained chauffeurs.",
        "maxPassengers": 4, "luggage": "3 large + 2 cabin",
        "exampleVehicles": ["Tesla Model S", "BMW i5"],
        "baseFare": {"amount": 5900, "currency": "USD"},
        "perKm": {"amount": 210, "currency": "USD"},
    },
    {
        "id": "luxury", "name": "Luxury",
        "description": "Flagship EVs with reclining rear seats and white-glove service.",
        "maxPassengers": 3, "luggage": "3 large + 2 cabin",
        "exampleVehicles": ["Mercedes EQS", "Porsche Taycan"],
        "baseFare": {"amount": 8900, "currency": "USD"},
        "perKm": {"amount": 320, "currency": "USD"},
    },
    {
        "id": "suv", "name": "Premium SUV",
        "description": "Seven seats and cavernous luggage space for families and groups.",
        "maxPassengers": 6, "luggage": "5 large + 4 cabin",
        "exampleVehicles": ["Kia EV9", "Volvo EX90"],
        "baseFare": {"amount": 7900, "currency": "USD"},
        "perKm": {"amount": 260, "currency": "USD"},
    },
]

# --------------------------------------------------------------------------- #
# Airports — pickup metadata + surcharge for the fare estimate.
# --------------------------------------------------------------------------- #
AIRPORTS = [
    {
        "code": "LOS", "name": "Murtala Muhammed International Airport",
        "location": {"lat": 6.5774, "lng": 3.3213, "label": "MMIA, Lagos"},
        "terminals": ["T1", "T2"],
        "pickupSurcharge": {"amount": 300, "currency": "USD"},
    },
    {
        "code": "LHR", "name": "London Heathrow",
        "location": {"lat": 51.4700, "lng": -0.4543, "label": "Heathrow, London"},
        "terminals": ["T2", "T3", "T4", "T5"],
        "pickupSurcharge": {"amount": 500, "currency": "USD"},
    },
    {
        "code": "DXB", "name": "Dubai International Airport",
        "location": {"lat": 25.2532, "lng": 55.3657, "label": "DXB, Dubai"},
        "terminals": ["T1", "T2", "T3"],
        "pickupSurcharge": {"amount": 400, "currency": "USD"},
    },
]

# --------------------------------------------------------------------------- #
# A mocked flight so /flights/{flightNo} returns something believable on stage.
# Estimated arrival is set relative to "now" at seed time.
# --------------------------------------------------------------------------- #
def demo_flight(now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    return {
        "number": "BA075",
        "status": "LANDED",
        "airportCode": "LOS",
        "terminal": "T2",
        "scheduledArrival": _iso(now - timedelta(minutes=10)),
        "estimatedArrival": _iso(now - timedelta(minutes=2)),
    }


@dataclass
class DemoUser:
    id: str
    email: str
    name: str
    role: str
    password: str = DEMO_PASSWORD
    rating: float | None = None
    available: bool | None = None
    vehicle: dict | None = None


def demo_users() -> list[DemoUser]:
    return [
        DemoUser(
            id=DEMO_RIDER_ID,
            email=DEMO_RIDER_EMAIL,
            name="Adaora O.",
            role="rider",
        ),
        DemoUser(
            id=DEMO_CHAUFFEUR_ID,
            email=DEMO_CHAUFFEUR_EMAIL,
            name="Daniel K.",
            role="chauffeur",
            rating=4.9,
            available=True,  # available so matching always succeeds in the demo
            vehicle={
                "model": "Tesla Model S",
                "plate": "EZY-114",
                "color": "Deep Blue",
                "tier": "executive",
            },
        ),
    ]


# --------------------------------------------------------------------------- #
# Deterministic fare estimate — mirrors POST /quotes so the seeded data and the
# live API agree. haversine distance keeps it dependency-free.
# --------------------------------------------------------------------------- #
def haversine_km(a: dict, b: dict) -> float:
    from math import asin, cos, radians, sin, sqrt

    r = 6371.0
    dlat = radians(b["lat"] - a["lat"])
    dlng = radians(b["lng"] - a["lng"])
    h = sin(dlat / 2) ** 2 + cos(radians(a["lat"])) * cos(radians(b["lat"])) * sin(dlng / 2) ** 2
    return round(2 * r * asin(sqrt(h)), 1)


def fare_estimate(pickup: dict, dropoff: dict, tier_id: str, airport_code: str | None = None) -> dict:
    tier = next(t for t in FLEET_TIERS if t["id"] == tier_id)
    distance_km = haversine_km(pickup, dropoff)
    base = tier["baseFare"]["amount"]
    distance_cost = int(round(distance_km * tier["perKm"]["amount"]))
    surcharge = 0
    if airport_code:
        airport = next((a for a in AIRPORTS if a["code"] == airport_code), None)
        if airport:
            surcharge = airport["pickupSurcharge"]["amount"]
    total = base + distance_cost + surcharge
    return {
        "tier": tier_id,
        "fare": {"amount": total, "currency": "USD"},
        "distanceKm": distance_km,
        "etaMin": max(8, int(round(distance_km * 1.6))),  # ~simple city estimate
        "breakdown": {"base": base, "distance": distance_cost, "airportSurcharge": surcharge},
    }


def build_dataset() -> dict:
    now = datetime.now(timezone.utc)
    # An example airport->city quote for LOS Terminal 2 -> Eko Hotel, Executive tier.
    pickup = {"lat": 6.5774, "lng": 3.3213, "label": "MMIA Terminal 2, Arrivals"}
    dropoff = {"lat": 6.4281, "lng": 3.4219, "label": "Eko Hotel"}
    sample_quote = fare_estimate(pickup, dropoff, "executive", airport_code="LOS")

    return {
        "users": [asdict(u) for u in demo_users()],
        "fleetTiers": FLEET_TIERS,
        "airports": AIRPORTS,
        "flights": [demo_flight(now)],
        "sampleQuote": {
            "quoteId": "q_demo_seed",
            **sample_quote,
            "airport": {"code": "LOS", "terminal": "T2"},
            "expiresAt": _iso(now + timedelta(minutes=15)),
        },
        "demoCredentials": {
            "rider": {"email": DEMO_RIDER_EMAIL, "password": DEMO_PASSWORD},
            "chauffeur": {"email": DEMO_CHAUFFEUR_EMAIL, "password": DEMO_PASSWORD},
        },
    }


# --------------------------------------------------------------------------- #
# Persistence hook — wire this to your DB of choice. Left as an explicit,
# idempotent upsert stub so the seed is safe to run repeatedly.
# --------------------------------------------------------------------------- #
def persist(dataset: dict) -> None:
    """
    Replace the body with real upserts, e.g. with SQLAlchemy:

        with Session(engine) as s:
            for u in dataset["users"]:
                s.merge(UserModel(**to_model(u)))   # merge = insert-or-update by PK
            for t in dataset["fleetTiers"]:
                s.merge(FleetTierModel(**t))
            ...
            s.commit()

    Or against Supabase:

        supabase.table("users").upsert(dataset["users"]).execute()

    Passwords here are plaintext demo constants — hash them (argon2/bcrypt)
    before storing in any environment.
    """
    raise NotImplementedError("Wire persist() to your DB layer, then remove this guard.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ezyride demo seed")
    parser.add_argument(
        "--emit",
        choices=["json", "env"],
        default="json",
        help="json = full dataset (default); env = frontend demo credentials",
    )
    parser.add_argument("--persist", action="store_true", help="Write to the DB via persist()")
    args = parser.parse_args()

    dataset = build_dataset()

    if args.persist:
        persist(dataset)
        print("Seed persisted.")
        return

    if args.emit == "env":
        creds = dataset["demoCredentials"]
        print(f"NEXT_PUBLIC_DEMO_RIDER_EMAIL={creds['rider']['email']}")
        print(f"NEXT_PUBLIC_DEMO_CHAUFFEUR_EMAIL={creds['chauffeur']['email']}")
        print(f"NEXT_PUBLIC_DEMO_PASSWORD={creds['rider']['password']}")
    else:
        print(json.dumps(dataset, indent=2))


if __name__ == "__main__":
    main()
