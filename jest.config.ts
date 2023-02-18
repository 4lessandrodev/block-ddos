import './global-setup';

module.exports = {
	roots: ['<rootDir>'],
	collectCoverage: false,
	clearMocks: true,
	coverageDirectory: 'coverage',
	testEnvironment: 'node',
	transform: {
		'.+\\.ts$': 'ts-jest',
	}
};
