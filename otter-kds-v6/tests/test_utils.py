"""Tests for utility functions."""

import pytest
import asyncio
import time
from unittest.mock import Mock

from src.utils.retry import retry


class TestRetryDecorator:
    """Tests for retry decorator."""
    
    @pytest.mark.asyncio
    async def test_async_retry_success_first_attempt(self):
        """Test async function succeeds on first attempt."""
        call_count = 0
        
        @retry(attempts=3, delay=0.1)
        async def async_func():
            nonlocal call_count
            call_count += 1
            return "success"
        
        result = await async_func()
        assert result == "success"
        assert call_count == 1
    
    @pytest.mark.asyncio
    async def test_async_retry_success_after_failures(self):
        """Test async function succeeds after retries."""
        call_count = 0
        
        @retry(attempts=3, delay=0.1)
        async def async_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("Temporary error")
            return "success"
        
        result = await async_func()
        assert result == "success"
        assert call_count == 3
    
    @pytest.mark.asyncio
    async def test_async_retry_all_attempts_fail(self):
        """Test async function fails after all retries."""
        call_count = 0
        
        @retry(attempts=3, delay=0.1)
        async def async_func():
            nonlocal call_count
            call_count += 1
            raise ValueError("Persistent error")
        
        with pytest.raises(ValueError, match="Persistent error"):
            await async_func()
        
        assert call_count == 3
    
    def test_sync_retry_success_first_attempt(self):
        """Test sync function succeeds on first attempt."""
        call_count = 0
        
        @retry(attempts=3, delay=0.1)
        def sync_func():
            nonlocal call_count
            call_count += 1
            return "success"
        
        result = sync_func()
        assert result == "success"
        assert call_count == 1
    
    def test_sync_retry_success_after_failures(self):
        """Test sync function succeeds after retries."""
        call_count = 0
        
        @retry(attempts=3, delay=0.1)
        def sync_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("Temporary error")
            return "success"
        
        result = sync_func()
        assert result == "success"
        assert call_count == 3
    
    def test_retry_with_specific_exceptions(self):
        """Test retry only catches specific exceptions."""
        call_count = 0
        
        @retry(attempts=3, delay=0.1, exceptions=(ValueError,))
        def func():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise ValueError("Retryable")
            elif call_count == 2:
                raise TypeError("Not retryable")
            return "success"
        
        with pytest.raises(TypeError, match="Not retryable"):
            func()
        
        assert call_count == 2  # Should stop on TypeError
    
    def test_retry_with_backoff(self):
        """Test retry with exponential backoff."""
        delays = []
        
        @retry(attempts=3, delay=0.1, backoff=2.0)
        def func():
            if len(delays) < 2:
                start = time.time()
                raise ValueError("Error")
            return "success"
        
        # Mock time.sleep to capture delays
        original_sleep = time.sleep
        
        def mock_sleep(duration):
            delays.append(duration)
            original_sleep(0.01)  # Small actual delay
        
        time.sleep = mock_sleep
        
        try:
            result = func()
            assert result == "success"
            assert len(delays) == 2
            assert abs(delays[0] - 0.1) < 0.01  # First delay
            assert abs(delays[1] - 0.2) < 0.01  # Second delay (backoff)
        finally:
            time.sleep = original_sleep