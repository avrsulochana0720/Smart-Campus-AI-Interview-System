import sys
import os
import time

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth import hash_password_native, verify_password_native

print("--- Authentication Hashing Benchmark ---")

# Test 1: Native Hashing Speed
print("\n1. Testing native SHA256 PBKDF2 hashing speed...")
start = time.time()
native_hash = hash_password_native("mypassword123")
native_duration = time.time() - start
print(f"   Native Hash: {native_hash}")
print(f"   Time Taken: {native_duration * 1000:.4f} ms (<1ms on C-extension, slightly more on pure CPU)")

# Test 2: Native Hashing Verification Speed
print("\n2. Testing native verification speed...")
start = time.time()
verified = verify_password_native("mypassword123", native_hash)
native_verify_duration = time.time() - start
print(f"   Verified: {verified}")
print(f"   Time Taken: {native_verify_duration * 1000:.4f} ms")

# Test 3: Legacy Hashing Verification Fallback Speed
print("\n3. Testing legacy fallback verification speed (will load passlib)...")
# Let's generate a legacy hash
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    legacy_hash = pwd_context.hash("mypassword123")
    print(f"   Legacy Hash: {legacy_hash[:40]}...")
    
    start = time.time()
    legacy_verified = verify_password_native("mypassword123", legacy_hash)
    legacy_verify_duration = time.time() - start
    print(f"   Legacy Verified: {legacy_verified}")
    print(f"   Time Taken: {legacy_verify_duration * 1000:.4f} ms (Legacy pbkdf2 context load & verify)")
except Exception as e:
    print(f"   Legacy setup failed or skipped: {e}")
