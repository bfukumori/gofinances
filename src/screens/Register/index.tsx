import React, { useState } from 'react';
import { Alert, Keyboard, Modal, TouchableWithoutFeedback } from 'react-native';

import uuid from 'react-native-uuid';
import { Button } from '../../components/Form/Button';
import { CategorySelectButton } from '../../components/Form/CategorySelectButton';
import { CategorySelect } from '../CategorySelect';
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton';
import {
  Container,
  Fields,
  Form,
  Header,
  Title,
  TransactionTypes,
} from './styles';
import { InputForm } from '../../components/Form/InputForm';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/auth';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

interface FormData {
  name: string;
  amount: string;
}

const schema = yup
  .object({
    name: yup.string().required('Nome é obrigatório'),
    amount: yup
      .number()
      .typeError('Informe um valor numérico')
      .positive('O valor não pode ser negativo')
      .required('O valor é obrigatório'),
  })
  .required();

export function Register() {
  const [transactionType, setTransactionType] = useState<
    'positive' | 'negative'
  >('positive');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria',
  });
  const navigation = useNavigation();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  function handleTransactionType(type: 'positive' | 'negative') {
    setTransactionType(type);
  }

  function handleOpenSelectCategoryModal() {
    setCategoryModalOpen(true);
  }
  function handleCloseSelectCategoryModal() {
    setCategoryModalOpen(false);
  }

  async function handleRegister(form: Partial<FormData>) {
    if (!transactionType) {
      return Alert.alert('Selecione o tipo da transação');
    }
    if (category.key === 'category') {
      return Alert.alert('Selecione a categoria');
    }

    const newTransaction = {
      id: String(uuid.v4()),
      name: form.name,
      amount: form.amount,
      type: transactionType,
      category: category.key,
      date: new Date(),
    };

    try {
      const dataKey = `@gofinances:transactions_user:${user.id}`;
      const data = await AsyncStorage.getItem(dataKey);
      const currentData = data ? JSON.parse(data) : [];
      const dataFormatted = [...currentData, newTransaction];

      await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));
      setTransactionType('positive');
      setCategory({
        key: 'category',
        name: 'Categoria',
      });
      reset();
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Não foi possível salvar');
    }
  }

  const ModalWithHoc = gestureHandlerRootHOC(() => (
    <CategorySelect
      category={category}
      setCategory={setCategory}
      closeSelectCategory={handleCloseSelectCategoryModal}
    />
  ));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container>
        <Header>
          <Title>Cadastro</Title>
        </Header>
        <Form>
          <Fields>
            <InputForm
              control={control}
              name="name"
              placeholder="Nome"
              autoCapitalize="sentences"
              autoCorrect={false}
              error={errors.name && (errors.name.message as string)}
            />
            <InputForm
              control={control}
              name="amount"
              placeholder="Preço"
              keyboardType="numeric"
              error={errors.amount && (errors.amount.message as string)}
            />
            <TransactionTypes>
              <TransactionTypeButton
                type="up"
                title="Income"
                onPress={() => handleTransactionType('positive')}
                isActive={transactionType === 'positive'}
              />
              <TransactionTypeButton
                type="down"
                title="Outcome"
                onPress={() => handleTransactionType('negative')}
                isActive={transactionType === 'negative'}
              />
            </TransactionTypes>
            <CategorySelectButton
              title={category.name}
              onPress={handleOpenSelectCategoryModal}
            />
          </Fields>
          <Button title="Enviar" onPress={handleSubmit(handleRegister)} />
        </Form>
        <Modal visible={categoryModalOpen}>
          <ModalWithHoc />
        </Modal>
      </Container>
    </TouchableWithoutFeedback>
  );
}
