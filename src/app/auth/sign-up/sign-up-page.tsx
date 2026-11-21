/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

// ! Form Components - Personal Information, Contact Information, Professional Information, Account Security, Done.
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import AccountSecurity from '@/app/auth/sign-up/tabs/account-security';
import ContactInformation from '@/app/auth/sign-up/tabs/contact-information';
import Finalization from '@/app/auth/sign-up/tabs/finalization';
import PersonalInformation from '@/app/auth/sign-up/tabs/personal-information';
import ProfessionalInformation from '@/app/auth/sign-up/tabs/professional-information';
import { signUp } from '@/src/actions/auth/sign-up';
import { OAuthComponent } from '@/src/app/auth/oauth/oauth-component';
import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import type { RegistrationDataType } from '@/types/auth/registration';
import type { ApiResponseOrError } from '@/types/rest/response';

const initialRegistrationData: RegistrationDataType = {
    accountSecurity: {
        commercialEmails: false,
        password: '',
        passwordConfirmation: '',
        terms: false,
    },
    contactInformation: {
        address: '',
        address2: '',
        city: '',
        country: '',
        email: '',
        phoneNumber: '',
        state: '',
        zipCode: '',
    },
    personalInformation: {
        dateOfBirth: '',
        firstName: '',
        lastName: '',
    },
    professionalInformation: {
        companyName: '',
        professionalAffiliations: [],
        qualifications: [],
        resume: null,
        specializations: [],
        translationExperience: 'Beginner',
    },
};

export default function SignUpPageContent() {
    const logger = getLogger('RCC:AUTH:SIGN-UP-PAGE');
    const [selectedIndex, setSelectedIndex] = useState<number>(0); // Start from step 0.

    const [information, setInformation] = useState<RegistrationDataType>(initialRegistrationData);

    const forward = useCallback(() => setSelectedIndex((prev) => prev + 1), []);
    const backward = useCallback(() => setSelectedIndex((prev) => prev - 1), []);

    // Generic Submit Handler
    const handleSubmit = useCallback(
        (section: keyof RegistrationDataType, values: RegistrationDataType[keyof RegistrationDataType]) => {
            setInformation((prev) => ({
                ...prev,
                [section]: values,
            }));
            forward();
        },
        [forward],
    );

    // Destructure useMutation's return values
    const {
        data: signUpData,
        error,
        isError,
        isPending: isLoading,
        isSuccess,
        mutateAsync: mutateSignUp,
    } = useMutation<ApiResponseOrError, Error, RegistrationDataType>({
        mutationFn: async (data: RegistrationDataType) => {
            const response = await signUp(data);

            if (response?.error || !response) {
                logger.error(['An error occurred while registering the user: ', response]);
                throw standardizeError(response);
            }

            return response;
        },
        onMutate: () => {
            forward();
        },
    });

    // Final Submission Handler
    const handleFinalSubmit = useCallback(
        async (accountSecurity: RegistrationDataType['accountSecurity']) => {
            return mutateSignUp({
                ...information,
                accountSecurity,
            });
        },
        [information, mutateSignUp],
    );

    // Define Steps Array
    const steps = [
        {
            component: (
                <PersonalInformation
                    backward={backward}
                    isLoading={isLoading}
                    personalInformation={information.personalInformation}
                    submitPersonalInformation={(values) => handleSubmit('personalInformation', values)}
                />
            ),
            extra: <OAuthComponent page="sign-up" />,
        },
        {
            component: (
                <ContactInformation
                    backward={backward}
                    contactInformation={information.contactInformation}
                    isLoading={isLoading}
                    submitContactInformation={(values) => handleSubmit('contactInformation', values)}
                />
            ),
        },
        {
            component: (
                <ProfessionalInformation
                    backward={backward}
                    isLoading={isLoading}
                    professionalInformation={information.professionalInformation}
                    submitProfessionalInformation={(values) =>
                        handleSubmit('professionalInformation', values)
                    }
                />
            ),
        },
        {
            component: (
                <AccountSecurity
                    accountSecurity={information.accountSecurity}
                    backward={backward}
                    isLoading={isLoading}
                    submitAccountSecurity={handleFinalSubmit}
                />
            ),
        },
        {
            component: (
                <Finalization
                    backward={backward}
                    error={error}
                    information={information}
                    isError={isError}
                    isLoading={isLoading}
                    isSuccess={isSuccess}
                    success={signUpData}
                />
            ),
        },
    ];

    return (
        <div className="flex w-full flex-col items-center justify-center gap-5">
            {steps[selectedIndex]?.component}
            {steps[selectedIndex]?.extra}
        </div>
    );
}
