"""Backend proxy tests for Afrishop → africashop.win reverse proxy."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://afrishop-11.preview.emergentagent.com").rstrip("/")
AFM = f"{BASE_URL}/api/afm"

TEST_EMAIL = "customer2@afrimarket.demo"
TEST_PASSWORD = "Test@2026"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Accept": "application/json", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    """Login once and share token for authenticated tests."""
    r = session.post(f"{AFM}/mobile/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"].get("role") == "CLIENT"
    return {"token": data["token"], "user": data["user"]}


# ---------- Public catalog ----------
class TestPublicCatalog:
    def test_categories(self, session):
        r = session.get(f"{AFM}/categories", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) > 0

    def test_products(self, session):
        r = session.get(f"{AFM}/products", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "products" in data
        assert isinstance(data["products"], list)
        assert len(data["products"]) > 0
        p0 = data["products"][0]
        assert "id" in p0 and "name" in p0

    def test_products_promo(self, session):
        r = session.get(f"{AFM}/products", params={"promo": 1}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "products" in data
        assert isinstance(data["products"], list)

    def test_shops(self, session):
        r = session.get(f"{AFM}/shops", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "shops" in data
        assert isinstance(data["shops"], list)


# ---------- Auth ----------
class TestAuth:
    def test_login_customer(self, auth):
        assert auth["token"]
        assert auth["user"]["role"] == "CLIENT"

    def test_login_bad_password(self, session):
        r = session.post(
            f"{AFM}/mobile/auth/login",
            json={"email": TEST_EMAIL, "password": "wrongpass"},
            timeout=30,
        )
        assert r.status_code in (400, 401, 403)


# ---------- Authenticated endpoints ----------
class TestAuthenticated:
    def test_orders_mine(self, session, auth):
        r = session.get(
            f"{AFM}/orders/mine",
            headers={"Authorization": f"Bearer {auth['token']}"},
            timeout=30,
        )
        assert r.status_code == 200
        data = r.json()
        assert "orders" in data
        assert isinstance(data["orders"], list)

    def test_wallet(self, session, auth):
        r = session.get(
            f"{AFM}/wallet",
            headers={"Authorization": f"Bearer {auth['token']}"},
            timeout=30,
        )
        assert r.status_code == 200
        data = r.json()
        # wallet should have some monetary structure
        assert isinstance(data, dict)


# ---------- Live order placement ----------
class TestOrderPlacement:
    def test_place_live_order(self, session, auth):
        # Pick a product from catalog
        pr = session.get(f"{AFM}/products", timeout=30)
        assert pr.status_code == 200
        products = pr.json().get("products", [])
        # Prefer products with stock > 0
        in_stock = [p for p in products if (p.get("stock") or 0) > 0]
        product = (in_stock or products)[0]
        pid = product["id"]

        r = session.post(
            f"{AFM}/orders",
            json={"items": [{"product_id": pid, "qty": 1}]},
            headers={"Authorization": f"Bearer {auth['token']}"},
            timeout=60,
        )
        assert r.status_code in (200, 201), f"Place order failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        # Expected shape: { message, orders: [ref...] }
        assert isinstance(data, dict)
        assert "orders" in data or "order" in data or "message" in data

        # Verify order shows up in /orders/mine
        mine = session.get(
            f"{AFM}/orders/mine",
            headers={"Authorization": f"Bearer {auth['token']}"},
            timeout=30,
        )
        assert mine.status_code == 200
        assert len(mine.json().get("orders", [])) >= 1
