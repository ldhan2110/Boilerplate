import React from 'react';

export const useToggle = (initValue: boolean) => {
	const [isToggle, setToggle] = React.useState(initValue);

	function toggle() {
		setToggle(!isToggle);
	}

	return {
		isToggle,
		toggle,
	};
};
