const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { mockRequest, mockResponse } = require('mock-req-res'); // You can install this library for mocking requests and responses.

describe('User Registration', () => {
  it('should register a user with valid input', async () => {
    const req = mockRequest({
      body: {
        username: 'johnDoe',
        email: 'johndoe@example.com',
        password: 'securePassword123',
      },
    });
    const res = mockResponse();

    // Simulating the bcrypt hash function
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Simulating the registration route
    const registrationHandler = async (req, res) => {
      const { username, email, password } = req.body;

      // Validate the input (similar to what you've done in the route)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Mocking the user creation logic
      const newUser = { username, email, password: hashedPassword };
      res.status(201).json({ message: 'User registered successfully!' });
    };

    await registrationHandler(req, res);

    // Test if the response status is 201
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully!' });
  });
});