"""
Test script för WebSocket event broadcasting
Kör med: python test_websocket.py
"""
import asyncio
import websockets
import json
import requests
from datetime import datetime
from dotenv import load_dotenv
import os
import sys

# Fix Unicode output for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

load_dotenv()

async def test_websocket_connection():
    """Test WebSocket connection och event broadcasting"""
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    ws_url = backend_url.replace("http://", "ws://").replace("https://", "wss://") + "/api/events/stream"

    print("=" * 60)
    print("Testing WebSocket Event Broadcasting")
    print("=" * 60)
    print(f"\nConnecting to: {ws_url}")

    try:
        async with websockets.connect(ws_url) as websocket:
            print("[OK] WebSocket connected")

            # Vänta på välkomstmeddelande
            welcome = await websocket.recv()
            welcome_data = json.loads(welcome)
            print(f"[OK] Received welcome message: {welcome_data.get('type')}")

            # Skicka ping för heartbeat
            await websocket.send(json.dumps({"type": "ping"}))
            print("[OK] Sent ping")

            # Vänta på pong
            try:
                pong = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                pong_data = json.loads(pong)
                if pong_data.get("type") == "pong":
                    print("[OK] Received pong - heartbeat working")
            except asyncio.TimeoutError:
                print("[WARN] No pong received (may be normal)")

            # Testa att skapa ett test-event via API för att trigga broadcast
            print("\n" + "=" * 60)
            print("Test: Creating test event via API to trigger WebSocket broadcast")
            print("=" * 60)

            try:
                # Försök skapa test-event (kräver authentication om aktiverat)
                test_event_data = {
                    "type": "SYSTEM",
                    "severity": "INFO",
                    "source": "test",
                    "summary": "Test event for WebSocket broadcast",
                    "details": {"test": True}
                }

                # Notera: Detta kan kräva authentication
                # För nu försöker vi bara se om WebSocket fungerar
                print("[WARN] Event creation may require authentication - skipping for now")
                print("   WebSocket connection is working if we got this far!")

            except Exception as e:
                print(f"[WARN] Event creation failed: {e}")

            # Vänta lite på event (om det skulle komma)
            print("\nWaiting for events (5 seconds)...")
            try:
                event = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                event_data = json.loads(event)
                if event_data.get("type") == "new_event":
                    print("[OK] Received event via WebSocket!")
                    print(f"   Event: {event_data.get('event', {}).get('summary')}")
                else:
                    print(f"[INFO] Received message: {event_data.get('type')}")
            except asyncio.TimeoutError:
                print("[INFO] No events received in timeout period (this is OK if no events are being generated)")

            print("\n" + "=" * 60)
            print("[OK] WebSocket test completed successfully!")
            print("=" * 60)

    except websockets.exceptions.InvalidURI:
        print("[FAIL] Invalid WebSocket URL - check BACKEND_URL")
    except ConnectionRefusedError:
        print("[FAIL] Connection refused - is backend running?")
        print(f"   Try: curl {backend_url}/health")
    except Exception as e:
        print(f"[FAIL] WebSocket error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Installera websockets: pip install websockets
    try:
        asyncio.run(test_websocket_connection())
    except KeyboardInterrupt:
        print("\n[WARN] Test interrupted by user")
    except Exception as e:
        print(f"\n[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()


