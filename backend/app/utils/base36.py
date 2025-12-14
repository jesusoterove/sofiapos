"""
Base-36 encoding/decoding utilities.
Uses standard base-36 character set: A-Z (0-25), 0-9 (26-35)
"""

# Base-36 character set: A-Z, 0-9
BASE36_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'


def encode_base36(number: int, min_length: int = 0) -> str:
    """
    Encode a number to base-36 string.
    
    Args:
        number: Integer to encode (must be >= 0)
        min_length: Minimum length of output string (padded with 'A' on the left)
    
    Returns:
        Base-36 encoded string
    
    Raises:
        ValueError: If number is negative
    """
    if number < 0:
        raise ValueError("Number must be non-negative")
    
    if number == 0:
        result = 'A'
    else:
        result = ''
        while number > 0:
            result = BASE36_CHARS[number % 36] + result
            number //= 36
    
    # Pad with 'A' to minimum length
    if len(result) < min_length:
        result = 'A' * (min_length - len(result)) + result
    
    return result


def decode_base36(string: str) -> int:
    """
    Decode a base-36 string to number.
    
    Args:
        string: Base-36 encoded string (case-insensitive)
    
    Returns:
        Decoded integer
    
    Raises:
        ValueError: If string contains invalid characters
    """
    string = string.upper()
    result = 0
    
    for char in string:
        if char not in BASE36_CHARS:
            raise ValueError(f"Invalid base-36 character: {char}")
        result = result * 36 + BASE36_CHARS.index(char)
    
    return result


def pad_base36(number: int, width: int) -> str:
    """
    Encode a number to base-36 and pad to specified width.
    
    Args:
        number: Integer to encode (must be >= 0)
        width: Desired width of output string (padded with 'A' on the left)
    
    Returns:
        Base-36 encoded string padded to width
    """
    return encode_base36(number, min_length=width)

