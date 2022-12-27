import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { useTheme } from "styled-components";
import { HighlightCard } from "../../components/HighlightCard";
import { HighlightCards } from "../../components/HighlightCard/styles";
import {
  TransactionCard,
  TransactionCardProps,
} from "../../components/TransactionCard";
import { useAuth } from "../../hooks/auth";
import {
  Container,
  Header,
  Icon,
  LoadingContainer,
  LogoutButton,
  Photo,
  Title,
  Transactions,
  TransactionsList,
  User,
  UserGreeting,
  UserInfo,
  UserName,
  UserWrapper,
} from "./styles";

export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface HighlighProps {
  amount: string;
  lastTransaction: string;
}

interface HighlightData {
  entries: HighlighProps;
  expenses: HighlighProps;
  total: HighlighProps;
}

export function Dashboard() {
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>(
    {} as HighlightData
  );
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const { signOut, user } = useAuth();

  function getLastTransactionDate(
    collection: DataListProps[],
    type: "positive" | "negative"
  ) {
    const collectionFiltered = collection.filter(
      (transaction) => transaction.type === type
    );

    if (collectionFiltered.length === 0) {
      return 0;
    }
    const lastTransaction = new Date(
      Math.max.apply(
        Math,
        collectionFiltered.map((transaction) =>
          new Date(transaction.date).getTime()
        )
      )
    );
    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleDateString(
      "pt-BR",
      {
        month: "long",
      }
    )}`;
  }

  async function loadTransactions() {
    try {
      const dataKey = `@gofinances:transactions_user:${user.id}`;
      const response = await AsyncStorage.getItem(dataKey);
      const transactions = response ? JSON.parse(response) : [];

      let entriesTotal = 0;
      let expensesTotal = 0;

      const transactionsFormatted: DataListProps[] = transactions.map(
        (transaction: DataListProps) => {
          if (transaction.type === "positive") {
            entriesTotal += Number(transaction.amount);
          } else {
            expensesTotal += Number(transaction.amount);
          }

          const amount = Number(transaction.amount).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          const date = Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }).format(new Date(transaction.date));
          return {
            id: transaction.id,
            name: transaction.name,
            amount,
            type: transaction.type,
            category: transaction.category,
            date,
          };
        }
      );
      setTransactions(transactionsFormatted);

      const lastTransactionsEntries = getLastTransactionDate(
        transactions,
        "positive"
      );

      const lastTransactionsExpenses = getLastTransactionDate(
        transactions,
        "negative"
      );

      const totalInterval =
        lastTransactionsExpenses === 0
          ? "Não há transações"
          : `01 a ${lastTransactionsExpenses}`;

      const total = entriesTotal - expensesTotal;

      setHighlightData({
        entries: {
          amount: entriesTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
          lastTransaction:
            lastTransactionsEntries === 0
              ? "Não há transações"
              : `Última entrada dia ${lastTransactionsEntries}`,
        },
        expenses: {
          amount: expensesTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
          lastTransaction:
            lastTransactionsExpenses === 0
              ? "Não há transações"
              : `Última saída dia ${lastTransactionsExpenses}`,
        },
        total: {
          amount: total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
          lastTransaction: totalInterval,
        },
      });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
      Alert.alert("Não foi possível recuperar a listagem de transações");
    }
  }
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );
  return (
    <Container>
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator color={colors.primary} size="large" />
        </LoadingContainer>
      ) : (
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo
                  source={{
                    uri: user.photo,
                  }}
                />
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>
              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>
          <HighlightCards>
            <HighlightCard
              title="Entradas"
              amount={highlightData.entries.amount}
              lastTransaction={highlightData.entries.lastTransaction}
              type="up"
            />
            <HighlightCard
              title="Saídas"
              amount={highlightData.expenses.amount}
              lastTransaction={highlightData.expenses.lastTransaction}
              type="down"
            />
            <HighlightCard
              title="Total"
              amount={highlightData.total.amount}
              lastTransaction={highlightData.total.lastTransaction}
              type="total"
            />
          </HighlightCards>
          <Transactions>
            <Title>Listagem</Title>
            <TransactionsList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
          </Transactions>
        </>
      )}
    </Container>
  );
}
