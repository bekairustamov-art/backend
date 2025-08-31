import PermissionModel from '../models/PermissionModel.js';

// Get current permissions
export async function getPermissions(req, res) {
  try {
    let permissions = await PermissionModel.getPermissions();
    if (!permissions) {
      permissions = await PermissionModel.createDefault();
    }
    res.json(permissions);
  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

// Update permissions
export async function updatePermissions(req, res) {
  try {
    const { is_register, is_usual_order, is_wholesaler_order } = req.body;

    // Build updates object with only provided fields
    const updates = {};
    if (typeof is_register === 'boolean') updates.is_register = is_register ? 1 : 0;
    if (typeof is_usual_order === 'boolean') updates.is_usual_order = is_usual_order ? 1 : 0;
    if (typeof is_wholesaler_order === 'boolean') updates.is_wholesaler_order = is_wholesaler_order ? 1 : 0;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedPermissions = await PermissionModel.updatePermissions(updates);
    res.json({ message: 'Permissions updated successfully', permissions: updatedPermissions });
  } catch (err) {
    console.error('Error updating permissions:', err);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
}