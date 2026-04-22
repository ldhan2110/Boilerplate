import { FormSearchInput } from '@components/common/form';
import { CountrySearchModal } from '../modals';

export const FormCountrySearch = () => {
	return (
		<FormSearchInput
			name="countryCode"
			label={'Country'}
			title={'Country'}
			modalsProps={{
				selectType: 'single',
				initialSearchValues: {
					useFlg: 'Y',
				},
			}}
			searchModal={<CountrySearchModal />}
			onSelectCallback={(record) => {
				console.log('Selected:', record);
			}}
		/>
	);
};
