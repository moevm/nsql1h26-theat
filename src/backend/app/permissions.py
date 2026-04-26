from typing import Any, Dict

from fastapi import Depends, HTTPException, status

from app.auth import get_current_user


def require_manager_or_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") not in {"manager", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager or admin role is required")
    return user


def can_modify_decoration(user: Dict[str, Any], decoration: Dict[str, Any]) -> bool:
    if user.get("role") == "admin":
        return True

    if user.get("role") == "manager" and decoration.get("author_id") == user.get("_id"):
        return True

    return False


def ensure_can_modify_decoration(user: Dict[str, Any], decoration: Dict[str, Any]) -> None:
    if not can_modify_decoration(user, decoration):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can modify only decorations created by you",
        )
