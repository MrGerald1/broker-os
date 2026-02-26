"""
Mock quote engine — simulates real-time multi-insurer quote generation.
In production, this calls live insurer APIs concurrently.
"""
import random
from decimal import Decimal
from typing import Any
from sqlalchemy.orm import Session

from app.models.insurer import Insurer
from app.models.insurance_plan import InsurancePlan
from app.models.commission_rate import CommissionRate


VEHICLE_USAGE_TP_PREMIUMS = {
    "private": 15000,
    "own_goods": 20000,
    "staff_bus": 20000,
    "commercial_truck": 100000,
    "special_type": 20000,
    "tricycle": 5000,
    "motorcycle": 3000,
}

HEALTH_BASE_PREMIUMS = {
    "basic": (58446, 90000),
    "standard": (120000, 200000),
    "premium": (250000, 450000),
    "executive": (500000, 900000),
}

TRAVEL_BASE_PREMIUMS = {
    "west_africa": (5000, 15000),
    "africa": (10000, 25000),
    "europe": (20000, 50000),
    "usa_canada": (40000, 100000),
    "asia": (25000, 60000),
    "worldwide": (50000, 120000),
}

DEVICE_RATE = 0.065  # 6.5% of sum insured


def generate_quotes(
    db: Session,
    broker_id: str,
    product_type: str,
    product_details: dict,
    coverage_type: str = None,
) -> list[dict]:
    """Generate mock quotes from all active insurers for a given product."""
    insurers = (
        db.query(Insurer)
        .filter(
            Insurer.status == "active",
            Insurer.products_offered.contains(product_type),
        )
        .all()
    )

    if not insurers:
        insurers = db.query(Insurer).filter(Insurer.status == "active").limit(5).all()

    commission_rates = {
        cr.insurer_id: float(cr.commission_rate)
        for cr in db.query(CommissionRate)
        .filter(CommissionRate.broker_id == broker_id, CommissionRate.product_type == product_type)
        .all()
    }

    results = []
    for insurer in insurers:
        premium = _calculate_premium(product_type, product_details, coverage_type, insurer)
        if premium is None:
            continue

        commission_rate = commission_rates.get(insurer.id, 0.15)
        commission_amount = int(premium * commission_rate)

        results.append(
            {
                "insurer_id": insurer.id,
                "insurer_name": insurer.name,
                "insurer_short_name": insurer.short_name,
                "plan_name": _get_plan_name(product_type, coverage_type, insurer.short_name),
                "annual_premium": premium,
                "coverage_limit": _get_coverage_limit(product_type, product_details, coverage_type),
                "commission_rate": commission_rate,
                "commission_amount": commission_amount,
                "key_benefits": _get_key_benefits(product_type, coverage_type),
                "top_exclusions": _get_exclusions(product_type),
                "source": "api" if insurer.api_integrated else "manual",
                "response_time_ms": random.randint(300, 2500) if insurer.api_integrated else 50,
            }
        )

    results.sort(key=lambda x: x["annual_premium"])
    return results


def _calculate_premium(
    product_type: str,
    details: dict,
    coverage_type: str,
    insurer: Any,
) -> int | None:
    jitter = 1 + random.uniform(-0.08, 0.12)

    if product_type == "auto":
        usage = details.get("vehicle_usage", "private")
        if coverage_type == "third_party":
            base = VEHICLE_USAGE_TP_PREMIUMS.get(usage, 15000)
            return int(base * jitter)
        elif coverage_type in ("comprehensive", "third_party_fire_theft"):
            sum_insured = details.get("sum_insured", 5000000)
            rate = 0.05 if coverage_type == "comprehensive" else 0.035
            return int(float(sum_insured) * rate * jitter)

    elif product_type == "health":
        tier = details.get("plan_tier", "standard")
        enrollees = details.get("enrollee_count", 1)
        lo, hi = HEALTH_BASE_PREMIUMS.get(tier, (120000, 200000))
        per_person = int(random.uniform(lo, hi) * jitter)
        return per_person * enrollees

    elif product_type == "travel":
        region = details.get("destination_region", "europe")
        travellers = details.get("traveller_count", 1)
        lo, hi = TRAVEL_BASE_PREMIUMS.get(region, (20000, 50000))
        base = int(random.uniform(lo, hi) * jitter)
        days = details.get("trip_days", 14)
        return int(base * (days / 14) * travellers)

    elif product_type == "device":
        sum_insured = details.get("sum_insured", 300000)
        return int(float(sum_insured) * DEVICE_RATE * jitter)

    elif product_type == "life":
        sum_assured = details.get("sum_assured", 10000000)
        age = details.get("age", 35)
        age_factor = 1 + (max(age - 30, 0) * 0.015)
        return int(float(sum_assured) * 0.004 * age_factor * jitter)

    return None


def _get_plan_name(product_type: str, coverage_type: str, insurer_name: str) -> str:
    names = {
        "auto": {
            "third_party": f"{insurer_name} Motor Third Party",
            "comprehensive": f"{insurer_name} Comprehensive Motor",
            "third_party_fire_theft": f"{insurer_name} Motor TPFT",
        },
        "health": f"{insurer_name} Health Plan",
        "travel": f"{insurer_name} Travel Shield",
        "device": f"{insurer_name} Device Protect",
        "life": f"{insurer_name} Life Assure",
    }
    if product_type == "auto":
        return names["auto"].get(coverage_type, f"{insurer_name} Motor Insurance")
    return names.get(product_type, f"{insurer_name} Insurance Plan")


def _get_coverage_limit(product_type: str, details: dict, coverage_type: str) -> int:
    if product_type == "auto":
        if coverage_type == "comprehensive":
            return int(details.get("sum_insured", 5000000))
        return 3000000  # TP NAICOM minimum for private
    elif product_type == "health":
        return 2000000
    elif product_type == "travel":
        return 15000000
    elif product_type == "device":
        return int(details.get("sum_insured", 300000))
    elif product_type == "life":
        return int(details.get("sum_assured", 10000000))
    return 0


def _get_key_benefits(product_type: str, coverage_type: str = None) -> list[str]:
    benefits_map = {
        "auto": {
            "third_party": [
                "Third-party bodily injury (unlimited)",
                "Third-party property damage ₦3m",
                "ECOWAS Brown Card included",
            ],
            "comprehensive": [
                "Own vehicle damage",
                "Third-party ₦5m TPPD",
                "Windscreen ₦100K",
                "Flood and fire cover",
            ],
        },
        "health": [
            "Outpatient consultations",
            "Inpatient surgery",
            "Emergency treatment",
            "Laboratory & diagnostics",
        ],
        "travel": [
            "Emergency medical abroad",
            "Medical evacuation",
            "Baggage loss cover",
            "Flight delay benefit",
        ],
        "device": [
            "Accidental screen damage",
            "Theft cover",
            "Liquid damage",
            "New device replacement",
        ],
        "life": [
            "Lump sum death benefit",
            "Accidental death 2× benefit",
            "Terminal illness payout",
        ],
    }
    if product_type == "auto":
        return benefits_map["auto"].get(coverage_type, benefits_map["auto"]["comprehensive"])
    return benefits_map.get(product_type, [])


def _get_exclusions(product_type: str) -> list[str]:
    exclusions = {
        "auto": ["Unlicensed driver", "DUI", "Wear and tear"],
        "health": ["Pre-existing (first 3 months)", "Cosmetic procedures", "Self-inflicted"],
        "travel": ["Pre-existing conditions", "Adventure sports", "Travel advisories"],
        "device": ["Software damage", "Pre-existing damage", "Deliberate damage"],
        "life": ["Suicide (first 12 months)", "Death while committing crime", "War"],
    }
    return exclusions.get(product_type, [])
