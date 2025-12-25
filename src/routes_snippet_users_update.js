// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.put(
    '/:id',
    authGuard,
    roleGuard(['admin']),
    [
        param('id').isUUID().withMessage('Invalid user ID'),
        body('firstName').optional().trim().notEmpty(),
        body('lastName').optional().trim().notEmpty(),
        body('role').optional().isIn(['student', 'faculty', 'admin', 'staff']),
        body('isActive').optional().isBoolean(),
        validateRequest
    ],
    async (req, res, next) => {
        try {
            const user = await User.findByPk(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            await user.update(req.body);

            res.json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
);
