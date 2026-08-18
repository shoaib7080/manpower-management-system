import jwt from "jsonwebtoken";
import User from "../../modules/users/models/User.js";

// ─── protect ─────────────────────────────────────────────────────────────────
// Verifies the Bearer JWT, attaches req.user, and blocks suspended accounts.
export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user no longer exists." });
      }

      // Block suspended accounts at the gate — every protected route benefits.
      if (!req.user.isActive) {
        return res.status(403).json({
          message: "Account suspended. Contact your administrator.",
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed." });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided." });
  }
};

// ─── requireModuleLevel ───────────────────────────────────────────────────────
// Checks the user's permissions[moduleName] level against the required minimum.
// Scale: 0 = none, 1 = viewer, 2 = operator, 3 = module admin.
// SuperAdmins (permissions.superAdmin === true) bypass all module checks.
//
// Usage: requireModuleLevel('operations', MODULE_LEVELS.OPERATOR)
export const requireModuleLevel = (moduleName, requiredLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized." });
    }

    // SuperAdmins have unrestricted access to every module
    if (req.user.permissions?.superAdmin === true) {
      return next();
    }

    const userLevel = req.user.permissions?.[moduleName] ?? 0;
    if (userLevel >= requiredLevel) {
      return next();
    }

    return res.status(403).json({
      message: `Access denied. Requires '${moduleName}' permission level ${requiredLevel} or higher.`,
    });
  };
};

// ─── requireSuperAdmin ────────────────────────────────────────────────────────
// Hard gate: only users with permissions.superAdmin === true may proceed.
// Used for user management routes (create, update, delete, list users).
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized." });
  }
  if (req.user.permissions?.superAdmin === true) {
    return next();
  }
  return res.status(403).json({
    message: "Access denied. Super-administrator privileges required.",
  });
};

// ─── requireLevel (deprecated) ───────────────────────────────────────────────
// Legacy middleware kept to avoid crashing any callsite missed during migration.
// Will be removed once all routes use requireModuleLevel.
// @deprecated
export const requireLevel = (maxAllowedLevel) => {
  return (req, res, next) => {
    // SuperAdmins bypass legacy checks too
    if (req.user?.permissions?.superAdmin === true) return next();
    if (req.user && req.user.level <= maxAllowedLevel) {
      return next();
    }
    return res.status(403).json({
      message: `[deprecated] Access denied. Requires Level ${maxAllowedLevel} or higher.`,
    });
  };
};
