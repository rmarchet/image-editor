import React, { useState } from 'react';
import styled from 'styled-components';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { Footer } from './components/Footer';
import { EditorProvider } from './context/EditorContext';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
`;

export const App: React.FC = () => {
  return (
    <EditorProvider>
      <AppContainer>
        <Header />
        <Canvas />
        <Footer />
      </AppContainer>
    </EditorProvider>
  );
}; 