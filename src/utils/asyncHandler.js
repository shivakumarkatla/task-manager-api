// Wraps an async controller function so that any rejected promise
// (i.e. any thrown error) is automatically passed to Express's next()
// function, which forwards it to our centralized error middleware.
// Without this, every controller would need its own try/catch block.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
