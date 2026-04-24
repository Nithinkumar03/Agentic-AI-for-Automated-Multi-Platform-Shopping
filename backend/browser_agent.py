from __future__ import annotations

import time
from pathlib import Path
from typing import Any

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from config import DMART_BASE_URL, SCREENSHOT_DIR, SELENIUM_HEADLESS, SELENIUM_IMPLICIT_WAIT


class BrowserAgent:
    def __init__(self) -> None:
        self._driver: webdriver.Chrome | None = None
        self._seq = 0

    def _next_shot(self, label: str) -> Path:
        SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
        self._seq += 1
        safe = label.replace("/", "_").replace(" ", "_")
        return SCREENSHOT_DIR / f"step_{self._seq:03d}_{safe}.png"

    def _ensure(self) -> webdriver.Chrome:
        if self._driver is not None:
            return self._driver
        options = Options()
        if SELENIUM_HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--window-size=1280,800")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        service = Service(ChromeDriverManager().install())
        self._driver = webdriver.Chrome(service=service, options=options)
        self._driver.implicitly_wait(SELENIUM_IMPLICIT_WAIT)
        return self._driver

    def close(self) -> None:
        if self._driver:
            self._driver.quit()
            self._driver = None

    def add_to_cart(self, product_id: str, qty: int) -> str:
        driver = self._ensure()
        url = f"{DMART_BASE_URL}/products/{product_id}"
        driver.get(url)
        qty = max(1, min(99, int(qty)))
        if qty != 1:
            qty_input = driver.find_element(By.CSS_SELECTOR, "[data-input='cart-quantity']")
            qty_input.clear()
            qty_input.send_keys(str(qty))
        add_btn = driver.find_element(By.CSS_SELECTOR, "[data-action='add-to-cart']")
        add_btn.click()
        time.sleep(0.6)
        shot = self._next_shot(f"add_{product_id}")
        driver.save_screenshot(str(shot))
        return str(shot)

    def view_cart(self) -> dict[str, Any]:
        driver = self._ensure()
        driver.get(f"{DMART_BASE_URL}/cart")
        shot = self._next_shot("cart")
        driver.save_screenshot(str(shot))
        return {"html": driver.page_source, "screenshot": str(shot), "url": driver.current_url}

    def checkout(self) -> dict[str, Any]:
        driver = self._ensure()
        driver.get(f"{DMART_BASE_URL}/cart")
        try:
            btn = driver.find_element(By.CSS_SELECTOR, "[data-action='checkout']")
            btn.click()
            WebDriverWait(driver, 10).until(EC.url_contains("/checkout"))
        except Exception:
            # keep going to capture whatever page we landed on
            pass
        shot = self._next_shot("checkout")
        driver.save_screenshot(str(shot))
        return {"html": driver.page_source, "screenshot": str(shot), "url": driver.current_url}
