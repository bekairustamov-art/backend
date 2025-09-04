export const testController = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Test endpoint is working!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in test endpoint',
      error: error.message
    });
  }
};
