import React from 'react'
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Button,
  TouchableOpacity,
} from 'react-native'
import { Constants, SecureStore, SQLite } from 'expo'

const db = SQLite.openDatabase('db.db')

class Items extends React.Component {
  state = {
    items: null,
  }

  componentDidMount() {
    this.update()
  }

  render() {
    const { items } = this.state
    if (items === null || items.length === 0) {
      return null
    }

    return (
      <View style={{ margin: 5 }}>
        {items.map(({ id, done, value }) => (
          <TouchableOpacity
            key={id}
            onPress={() => this.props.onPressItem && this.props.onPressItem(id)}
          >
            <View style={styles.listItem}>
              <Text style={styles.itemText}>{value}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  update() {
    db.transaction(tx => {
      tx.executeSql(
        `select * from items where done = ?;`,
        [this.props.done ? 1 : 0],
        (_, { rows: { _array } }) => this.setState({ items: _array })
      )
    })
  }
}

export default class App extends React.Component {
  state = {
    text: null,
  }

  componentDidMount() {
    db.transaction(tx => {
      tx.executeSql(
        'create table if not exists items (id integer primary key not null, done int, value text);'
      )
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            flexDirection: 'row',
          }}
        >
          <TextInput
            style={styles.todoText}
            value={this.state.text}
            onChangeText={text => this.setState({ text })}
          />
        </View>
        <View style={{ flex: 3 }}>
          <Items
            style={styles.list}
            done={false}
            ref={todo => (this.todo = todo)}
            onPressItem={id =>
              db.transaction(
                tx => {
                  tx.executeSql(`update items set done = 1 where id = ?;`, [id])
                },
                null,
                this.update
              )
            }
          />
          <Items
            done={true}
            ref={done => (this.done = done)}
            onPressItem={id =>
              db.transaction(
                tx => {
                  tx.executeSql(`delete from items where id = ?;`, [id])
                },
                null,
                this.update
              )
            }
          />
        </View>
        <Button
          style={{ marginBottom: 100 }}
          title={'Add Todo'}
          onPress={() => {
            this.add(this.state.text)
            this.setState({ text: null })
          }}
        />
      </View>
    )
  }

  add(text) {
    db.transaction(
      tx => {
        tx.executeSql('insert into items (done, value) values (0, ?)', [text])
        tx.executeSql('select * from items', [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        )
      },
      null,
      this.update
    )
  }

  update = () => {
    this.todo && this.todo.update()
    this.done && this.done.update()
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',

    justifyContent: 'center',
    paddingTop: Expo.Constants.statusBarHeight,
  },
  todoText: {
    width: '90%',
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 20,
    borderBottomWidth: 2,
    fontSize: 18,
    justifyContent: 'center',
  },
  list: {
    width: '100%',
    flex: 1,
  },
  listItem: {
    backgroundColor: '#4286f4',
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
    color: 'white',
  },
})
