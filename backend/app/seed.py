"""Seed database with realistic Nigerian insurance broker demo data."""
from datetime import datetime, date, timedelta
import os
import random
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Client, Insurer, InsurancePlan, CommissionRate,
    Quote, Policy, Transaction, Wallet, Notification,
)
from app.services.auth_service import get_password_hash


INSURERS = [
    {"name": "Leadway Assurance", "short_name": "Leadway", "api_integrated": True,
     "products_offered": ["auto", "health", "life", "travel"], "contact_email": "partnerships@leadway.com"},
    {"name": "Heirs Insurance Nigeria", "short_name": "Heirs", "api_integrated": True,
     "products_offered": ["auto", "health", "life", "device", "travel"], "contact_email": "dev@heirsinsurance.com"},
    {"name": "AXA Mansard Insurance", "short_name": "AXA Mansard", "api_integrated": True,
     "products_offered": ["auto", "health", "life", "travel"], "contact_email": "brokers@axamansard.com"},
    {"name": "AIICO Insurance", "short_name": "AIICO", "api_integrated": False,
     "products_offered": ["life", "health", "auto"], "contact_email": "info@aiicoplc.com"},
    {"name": "Custodian Investment & Allied", "short_name": "Custodian", "api_integrated": False,
     "products_offered": ["auto", "life"], "contact_email": "info@custodianplc.com.ng"},
    {"name": "Mutual Benefits Assurance", "short_name": "Mutual Benefits", "api_integrated": False,
     "products_offered": ["life", "auto", "health"], "contact_email": "info@mutualng.com"},
    {"name": "Cornerstone Insurance", "short_name": "Cornerstone", "api_integrated": False,
     "products_offered": ["auto", "life"], "contact_email": "info@cornerstone.com.ng"},
    {"name": "Sovereign Trust Insurance", "short_name": "Sovereign", "api_integrated": False,
     "products_offered": ["auto", "health"], "contact_email": "info@sovereigntrust.com.ng"},
    {"name": "NEM Insurance", "short_name": "NEM", "api_integrated": False,
     "products_offered": ["auto"], "contact_email": "info@neminsurance.com"},
    {"name": "NSIA Insurance", "short_name": "NSIA", "api_integrated": False,
     "products_offered": ["auto", "health", "life", "travel"], "contact_email": "info@nsia-insurance.com"},
]

DEMO_CLIENTS = [
    {"type": "individual", "full_name": "Adebayo Okafor", "phone": "08031234567",
     "email": "adebayo.okafor@gmail.com", "address": "15 Bourdillon Road, Ikoyi, Lagos"},
    {"type": "corporate", "full_name": "Dangote Cement Plc", "phone": "08012345678",
     "email": "insurance@dangotecement.com", "company_name": "Dangote Cement Plc",
     "cac_number": "RC-123456", "industry_sector": "Manufacturing", "employee_count": 2500,
     "address": "Union Marble House, 1 Alfred Rewane Road, Ikoyi, Lagos"},
    {"type": "individual", "full_name": "Chidinma Eze", "phone": "08098765432",
     "email": "chidinma.eze@yahoo.com", "address": "42 Ikeja GRA, Lagos"},
    {"type": "corporate", "full_name": "Zenith Bank Plc", "phone": "07011223344",
     "email": "insurance@zenithbank.com", "company_name": "Zenith Bank Plc",
     "cac_number": "RC-789012", "industry_sector": "Finance", "employee_count": 8000,
     "address": "Plot 84, Ajose Adeogun Street, Victoria Island, Lagos"},
    {"type": "individual", "full_name": "Emeka Nwosu", "phone": "08155667788",
     "email": "emeka.nwosu@gmail.com", "address": "7 Aminu Kano Crescent, Wuse II, Abuja"},
    {"type": "individual", "full_name": "Fatimah Abubakar", "phone": "07066778899",
     "email": "fatimah.a@hotmail.com", "address": "23 Murtala Mohammed Way, Kano"},
    {"type": "corporate", "full_name": "Access Bank Plc", "phone": "01-2802000",
     "email": "insurance@accessbankplc.com", "company_name": "Access Bank Plc",
     "cac_number": "RC-456789", "industry_sector": "Finance", "employee_count": 12000,
     "address": "Plot 999C, Danmole Street, Victoria Island, Lagos"},
    {"type": "individual", "full_name": "Olumide Bakare", "phone": "09033445566",
     "email": "olumide.bakare@gmail.com", "address": "56 Bode Thomas Street, Surulere, Lagos"},
]

POLICY_PLANS = [
    ("auto", "Leadway Comprehensive Motor", 480000, 0.15),
    ("health", "AXA Mansard Standard Health", 180000, 0.18),
    ("auto", "Heirs Third Party Motor", 15000, 0.12),
    ("life", "AIICO Term Life 10yr", 65000, 0.25),
    ("travel", "Leadway Travel Shield Europe", 45000, 0.20),
    ("auto", "AXA Mansard Comprehensive", 520000, 0.15),
    ("health", "Heirs Premium Health Executive", 420000, 0.18),
    ("device", "Heirs Device Protect iPhone", 84000, 0.15),
]


def seed(db: Session):
    print("Seeding database...")

    # Demo broker
    existing = db.query(User).filter(User.email == "demo@brokeross.ng").first()
    if existing:
        print("Demo user already exists, skipping seed.")
        return

    broker = User(
        account_type="broker",
        business_name="Apex Insurance Brokers Ltd",
        ncrib_license_number="NCRIB/B/2019/0042",
        email="demo@brokeross.ng",
        email_verified=True,
        phone="08000000001",
        hashed_password=get_password_hash(os.environ.get("DEMO_BROKER_PASSWORD", "demo1234")),
        business_address="45 Marina Street, Lagos Island, Lagos",
        cac_number="RC-112233",
        role="admin",
        status="active",
        commission_type="custom",
        last_login_at=datetime.utcnow(),
    )
    db.add(broker)
    db.flush()

    wallet = Wallet(
        broker_id=broker.id,
        available_balance=1247000,
        pending_balance=0,
        total_gwp_all_time=28540000,
        total_commissions_all_time=4450000,
        bank_accounts=[
            {
                "bank_name": "Zenith Bank",
                "account_number": "2112345678",
                "account_name": "Apex Insurance Brokers Ltd",
                "is_default": True,
            }
        ],
    )
    db.add(wallet)

    # Insurers
    insurer_objs = []
    for ins_data in INSURERS:
        ins = Insurer(**ins_data)
        db.add(ins)
        insurer_objs.append(ins)
    db.flush()

    # Commission rates for broker
    product_types = ["auto", "health", "life", "travel", "device"]
    for ins in insurer_objs:
        for pt in product_types:
            if pt in ins.products_offered:
                rate = CommissionRate(
                    broker_id=broker.id,
                    insurer_id=ins.id,
                    product_type=pt,
                    commission_rate=0.15,
                    verified=True,
                )
                db.add(rate)

    # Clients
    client_objs = []
    for c_data in DEMO_CLIENTS:
        c = Client(broker_id=broker.id, **c_data)
        db.add(c)
        client_objs.append(c)
    db.flush()

    # Policies (some active, some expiring)
    leadway = insurer_objs[0]
    for i, (prod_type, plan_name, premium, comm_rate) in enumerate(POLICY_PLANS):
        client = client_objs[i % len(client_objs)]
        comm_amount = int(premium * comm_rate)
        net = premium - comm_amount

        days_ago = random.randint(10, 300)
        start = date.today() - timedelta(days=days_ago)
        end = start + timedelta(days=365)
        status_val = "expiring_soon" if (end - date.today()).days <= 30 else "active"

        policy = Policy(
            client_id=client.id,
            broker_id=broker.id,
            insurer_id=leadway.id,
            product_type=prod_type,
            plan_name=plan_name,
            annual_premium=premium,
            commission_rate=comm_rate,
            commission_amount=comm_amount,
            net_remittance_to_insurer=net,
            status=status_val,
            start_date=start,
            end_date=end,
            activated_at=datetime.utcnow() - timedelta(days=days_ago),
        )
        db.add(policy)
        db.flush()

        tx = Transaction(
            policy_id=policy.id,
            client_id=client.id,
            broker_id=broker.id,
            paystack_reference=f"pay_ref_{i:04d}",
            premium_amount=premium,
            commission_rate=comm_rate,
            commission_amount=comm_amount,
            net_remittance=net,
            payment_channel=random.choice(["card", "bank_transfer", "ussd"]),
            status="confirmed",
            confirmed_at=datetime.utcnow() - timedelta(days=days_ago),
        )
        db.add(tx)

    # Recent quotes (draft/sent)
    for i in range(5):
        client = client_objs[i % len(client_objs)]
        quote = Quote(
            client_id=client.id,
            created_by_user_id=broker.id,
            product_type=random.choice(["auto", "health", "travel"]),
            coverage_type=random.choice(["comprehensive", "standard", None]),
            product_details={"sum_insured": 12000000, "plan_tier": "standard"},
            quotes_returned=[],
            status=random.choice(["draft", "sent"]),
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
        )
        db.add(quote)

    # Notifications
    notif_msgs = [
        ("payment_received", "Payment Received", "Adebayo Okafor paid ₦480,000 for Comprehensive Motor. Confirm your commission."),
        ("policy_expiring", "Policy Expiring Soon", "Chidinma Eze's AXA Health Plan expires in 15 days. Initiate renewal."),
        ("license_verified", "NCRIB License Verified", "Your NCRIB license has been verified. Your account is now fully active."),
    ]
    for ntype, title, body in notif_msgs:
        n = Notification(
            user_id=broker.id,
            type=ntype,
            title=title,
            body=body,
            status="unread",
        )
        db.add(n)

    db.commit()
    print("Seed complete. Demo user: demo@brokeross.ng")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
