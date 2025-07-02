import { gql } from '@apollo/client';

export const ADD_MEDICATION = gql`
  mutation AddMedication($input: MedicationInput!) {
    addMedication(input: $input) {
      id
      name
      scheduleTime
    }
  }
`;

export const GET_DASHBOARD = gql`
  query Dashboard {
    dashboard {
      upcomingDoses {
        id
        name
        scheduleTime
      }
      missedDoses {
        id
        name
        scheduleTime
      }
      refillAlerts {
        name
        status
      }
    }
  }
`;
